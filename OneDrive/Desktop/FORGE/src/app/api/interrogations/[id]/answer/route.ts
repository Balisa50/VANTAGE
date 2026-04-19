import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  GRADE_PROMPT,
  VERDICT_PROMPT,
  TOTAL_QUESTIONS,
  PASS_THRESHOLD,
  MAX_POINTS_PER_QUESTION,
  type QuestionType,
  type GradedAnswer,
} from "@/lib/interrogation";
import { createWithFallback } from "@/lib/openai";
import { sendInterrogationResultEmail } from "@/lib/email";

/**
 * Grade an open-ended answer against the hidden rubric.
 *
 * On the final question: compute pass/fail, issue verdict, then cascade:
 *   → task verified + next task unlocked
 *   → integrity bonus (+2) on clean pass
 *   → auto-certificate when all tasks complete
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: interrogationId } = await params;
  const { questionNumber, answerText, timeSpent } = await req.json();

  const interrogation = await prisma.interrogation.findUnique({
    where: { id: interrogationId },
    include: {
      checkin: {
        include: {
          user: { select: { name: true, id: true } },
          task: true,
        },
      },
    },
  });

  if (!interrogation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (interrogation.checkin.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const studentName = interrogation.checkin.user.name ?? "Student";
  const transcript = interrogation.transcript as Array<{
    role: string;
    content: string;
    questionNumber?: number;
    topic?: string;
    type?: QuestionType;
    rubric?: {
      idealAnswer: string;
      mustMention: string[];
      pitfalls: string[];
      scoring: Record<string, string>;
    };
    score?: number;
    feedback?: string;
    hitKeypoints?: string[];
    missedKeypoints?: string[];
  }>;

  // Find the question entry with its hidden rubric
  const questionEntry = transcript.find(
    (t) => t.role === "assistant" && t.questionNumber === questionNumber,
  );
  if (!questionEntry) return NextResponse.json({ error: "Question not found" }, { status: 400 });

  const rubric = questionEntry.rubric;
  if (!rubric) {
    return NextResponse.json({ error: "Rubric missing — question malformed" }, { status: 500 });
  }

  const questionData = JSON.parse(questionEntry.content) as { question: string };

  // ─── GRADE THE ANSWER ─────────────────────────────────────────────
  const gradePrompt = GRADE_PROMPT(studentName, questionData.question, rubric, answerText ?? "");

  let graded: GradedAnswer = {
    score: 0,
    feedback: "Grader unavailable. Counted as 0.",
    hitKeypoints: [],
    missedKeypoints: rubric.mustMention,
  };

  try {
    const { completion } = await createWithFallback(
      {
        messages: [{ role: "user", content: gradePrompt }],
        temperature: 0.2,
        max_tokens: 500,
      },
      { timeoutMs: 30000 },
    );

    const raw = completion.choices[0].message.content ?? "{}";
    const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Partial<GradedAnswer>;
      const score = Math.max(0, Math.min(MAX_POINTS_PER_QUESTION, Math.round(Number(parsed.score ?? 0))));
      graded = {
        score,
        feedback: typeof parsed.feedback === "string" ? parsed.feedback : "",
        hitKeypoints: Array.isArray(parsed.hitKeypoints) ? parsed.hitKeypoints : [],
        missedKeypoints: Array.isArray(parsed.missedKeypoints) ? parsed.missedKeypoints : [],
      };
    }
  } catch (err) {
    console.error("Grading failed:", err instanceof Error ? err.message : err);
  }

  // Record graded answer in transcript
  const updatedTranscript = [
    ...transcript,
    {
      role: "user",
      content: answerText ?? "",
      questionNumber,
      score: graded.score,
      feedback: graded.feedback,
      hitKeypoints: graded.hitKeypoints,
      missedKeypoints: graded.missedKeypoints,
      timeSpent,
    },
  ];

  await prisma.interrogation.update({
    where: { id: interrogationId },
    data: { transcript: updatedTranscript },
  });

  const isLastQuestion = questionNumber === TOTAL_QUESTIONS;

  if (!isLastQuestion) {
    return NextResponse.json({
      completed: false,
      score: graded.score,
      feedback: graded.feedback,
      hitKeypoints: graded.hitKeypoints,
      missedKeypoints: graded.missedKeypoints,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // FINAL QUESTION — tally, verdict, side effects
  // ═══════════════════════════════════════════════════════════════════

  const answerEntries = updatedTranscript.filter(
    (t) => t.role === "user" && t.questionNumber !== undefined,
  );

  const allAnswers = answerEntries.map((a) => {
    const q = updatedTranscript.find(
      (t) => t.role === "assistant" && t.questionNumber === a.questionNumber,
    ) as typeof transcript[0] | undefined;
    return {
      score: a.score ?? 0,
      topic: q?.topic ?? "",
      missed: a.missedKeypoints ?? [],
      question: q ? (JSON.parse(q.content) as { question: string }).question : "",
    };
  });

  const totalScore = allAnswers.reduce((s, a) => s + a.score, 0);
  const passed = totalScore >= PASS_THRESHOLD;
  const overallScore = Number(((totalScore / (TOTAL_QUESTIONS * MAX_POINTS_PER_QUESTION)) * 10).toFixed(2));

  // ─── VERDICT ────────────────────────────────────────────────────────
  let verdict = "";
  try {
    const { completion: verdictRes } = await createWithFallback(
      {
        messages: [{ role: "user", content: VERDICT_PROMPT(
          studentName,
          allAnswers.map((a) => ({ question: a.question, score: a.score, topic: a.topic, missed: a.missed })),
          totalScore,
          passed,
        )}],
        max_tokens: 200,
        temperature: 0.6,
      },
      { timeoutMs: 20000 },
    );
    verdict = (verdictRes.choices[0].message.content ?? "")
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .trim();
  } catch {
    verdict = passed
      ? `${totalScore}/${TOTAL_QUESTIONS * MAX_POINTS_PER_QUESTION}. Good work — you demonstrated real understanding.`
      : `${totalScore}/${TOTAL_QUESTIONS * MAX_POINTS_PER_QUESTION}. Not enough to pass (need ${PASS_THRESHOLD}). Review the material and try again.`;
  }

  // ─── PERSIST FINAL RESULT ──────────────────────────────────────────
  await prisma.interrogation.update({
    where: { id: interrogationId },
    data: {
      passed,
      overallScore,
      feedback: verdict,
      transcript: updatedTranscript,
      completedAt: new Date(),
    },
  });

  await prisma.checkin.update({
    where: { id: interrogation.checkinId },
    data: { status: passed ? "passed" : "failed" },
  });

  if (passed) {
    // ─── TASK VERIFICATION + NEXT TASK UNLOCK ────────────────────────
    await prisma.task.update({
      where: { id: interrogation.checkin.taskId },
      data: { status: "verified", verifiedAt: new Date() },
    });

    const currentTask = await prisma.task.findUnique({
      where: { id: interrogation.checkin.taskId },
      include: { phase: { include: { tasks: { orderBy: { sortOrder: "asc" } } } } },
    });

    if (currentTask) {
      const tasks = currentTask.phase.tasks;
      const currentIndex = tasks.findIndex((t) => t.id === currentTask.id);

      if (currentIndex >= 0 && currentIndex < tasks.length - 1) {
        // Unlock the next task in the same phase
        const nextTask = tasks[currentIndex + 1];
        if (nextTask.status === "locked") {
          await prisma.task.update({ where: { id: nextTask.id }, data: { status: "available" } });
        }
      } else if (currentIndex === tasks.length - 1) {
        // Last task in phase — unlock first task of next phase
        const allVerified = tasks.every((t) => t.id === currentTask.id ? true : t.status === "verified");
        if (allVerified) {
          const track = await prisma.track.findFirst({
            where: { phases: { some: { id: currentTask.phaseId } } },
            include: {
              phases: {
                orderBy: { sortOrder: "asc" },
                include: { tasks: { orderBy: { sortOrder: "asc" }, take: 1 } },
              },
            },
          });
          if (track) {
            const phaseIndex = track.phases.findIndex((p) => p.id === currentTask.phaseId);
            const nextPhase = track.phases[phaseIndex + 1];
            if (nextPhase?.tasks[0]?.status === "locked") {
              await prisma.task.update({ where: { id: nextPhase.tasks[0].id }, data: { status: "available" } });
            }
          }
        }
      }
    }

    // ─── INTEGRITY BONUS (+2 on clean pass) ──────────────────────────
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { integrityScore: true },
    });
    if (currentUser !== null) {
      const delta = 2;
      const scoreAfter = currentUser.integrityScore + delta;
      await prisma.$transaction([
        prisma.user.update({ where: { id: session.user.id }, data: { integrityScore: scoreAfter } }),
        prisma.integrityLog.create({
          data: {
            userId: session.user.id,
            event: "clean_streak",
            description: "Passed interrogation with genuine understanding",
            scoreBefore: currentUser.integrityScore,
            scoreAfter,
            delta,
          },
        }),
      ]);
    }

    // ─── AUTO-CERTIFICATE ────────────────────────────────────────────
    const roadmapId = interrogation.checkin.roadmapId;
    const roadmapForCert = await prisma.roadmap.findFirst({
      where: { id: roadmapId, userId: session.user.id },
      include: {
        tracks: {
          include: {
            phases: { include: { tasks: { select: { id: true, status: true, estimatedHours: true } } } },
          },
        },
        checkins: {
          include: { interrogation: { select: { overallScore: true, passed: true } } },
        },
      },
    });

    if (roadmapForCert) {
      const allTasks = roadmapForCert.tracks.flatMap((tr) => tr.phases.flatMap((ph) => ph.tasks));
      const verifiedCount = allTasks.filter(
        (t) => t.status === "verified" || t.id === interrogation.checkin.taskId,
      ).length;

      if (verifiedCount === allTasks.length && allTasks.length > 0) {
        const existingCert = await prisma.certificate.findFirst({ where: { userId: session.user.id, roadmapId } });

        if (!existingCert) {
          const interrogations = roadmapForCert.checkins
            .filter((c) => c.interrogation)
            .map((c) => c.interrogation!);
          const passedCount = interrogations.filter((i) => i.passed).length;
          const passRate = interrogations.length > 0 ? passedCount / interrogations.length : 0;
          const totalHours = allTasks.reduce((s, t) => s + (t.estimatedHours ?? 0), 0);

          await prisma.certificate.create({
            data: {
              userId: session.user.id,
              roadmapId,
              title: roadmapForCert.title,
              totalTasks: allTasks.length,
              totalHours,
              passRate: Number(passRate.toFixed(2)),
            },
          }).catch(() => { /* non-critical */ });
        }
      }
    }
  }

  // Fire-and-forget interrogation result email
  prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
    .then((u) => {
      if (u?.email) {
        sendInterrogationResultEmail(
          u.email,
          studentName,
          passed,
          totalScore,
          TOTAL_QUESTIONS * MAX_POINTS_PER_QUESTION,
          verdict,
          interrogation.checkin.task.title,
        ).catch(() => {});
      }
    }).catch(() => {});

  return NextResponse.json({
    completed: true,
    score: graded.score,
    feedback: graded.feedback,
    hitKeypoints: graded.hitKeypoints,
    missedKeypoints: graded.missedKeypoints,
    passed,
    totalScore,
    maxScore: TOTAL_QUESTIONS * MAX_POINTS_PER_QUESTION,
    verdict,
  });
}
