import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VERDICT_PROMPT, calculateScores, type MCQQuestion, type QuestionType } from "@/lib/interrogation";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TOTAL_QUESTIONS = 10;
const PASS_THRESHOLD = 7;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: interrogationId } = await params;
  const { questionNumber, selected, timeSpent } = await req.json();

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

  const transcript = interrogation.transcript as Array<{
    role: string;
    content: string;
    questionNumber?: number;
    topic?: string;
    correct?: boolean;
    selected?: string;
  }>;

  // Find the question in transcript
  const questionEntry = transcript.find((t) => t.role === "assistant" && t.questionNumber === questionNumber);
  if (!questionEntry) return NextResponse.json({ error: "Question not found" }, { status: 400 });

  const questionData = JSON.parse(questionEntry.content) as MCQQuestion;
  const correct = selected === questionData.correctAnswer;

  // Record answer in transcript
  const updatedTranscript = [
    ...transcript,
    {
      role: "user",
      content: `Answer: ${selected}`,
      questionNumber,
      selected,
      correct,
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
      correct,
      correctAnswer: questionData.correctAnswer,
      explanation: questionData.explanation,
      completed: false,
    });
  }

  // Last question — calculate final scores
  const allAnswers = updatedTranscript
    .filter((t) => t.role === "user" && t.questionNumber !== undefined)
    .map((t) => {
      const qEntry = transcript.find((q) => q.role === "assistant" && q.questionNumber === t.questionNumber);
      const qData = qEntry ? (JSON.parse(qEntry.content) as MCQQuestion) : null;
      return {
        correct: t.correct ?? false,
        type: (qData?.type ?? "APPLICATION") as QuestionType,
        topic: qData?.topic ?? "",
      };
    });

  const correctCount = allAnswers.filter((a) => a.correct).length;
  const passed = correctCount >= PASS_THRESHOLD;
  const scores = calculateScores(allAnswers);

  // Generate verdict
  let verdict = "";
  try {
    const verdictPrompt = VERDICT_PROMPT(
      interrogation.checkin.user.name,
      allAnswers.map((a, i) => ({ question: `Q${i + 1}`, correct: a.correct, topic: a.topic })),
      scores,
    );

    const verdictRes = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: verdictPrompt }],
      max_tokens: 200,
      temperature: 0.7,
    });
    verdict = verdictRes.choices[0].message.content ?? "";
  } catch {
    verdict = passed
      ? `${correctCount}/${TOTAL_QUESTIONS} correct. Interrogation passed.`
      : `${correctCount}/${TOTAL_QUESTIONS} correct. Interrogation failed. Minimum ${PASS_THRESHOLD} required.`;
  }

  // Save final results
  await prisma.interrogation.update({
    where: { id: interrogationId },
    data: {
      passed,
      masteryScore: scores.mastery,
      applicationScore: scores.application,
      analysisScore: scores.analysis,
      recallScore: scores.recall,
      depthScore: scores.depth,
      overallScore: scores.overall,
      feedback: verdict,
      transcript: updatedTranscript,
      completedAt: new Date(),
    },
  });

  // Update checkin status
  await prisma.checkin.update({
    where: { id: interrogation.checkinId },
    data: { status: passed ? "passed" : "failed" },
  });

  if (passed) {
    // Mark task as verified
    await prisma.task.update({
      where: { id: interrogation.checkin.taskId },
      data: { status: "verified", verifiedAt: new Date() },
    });

    // Unlock next task in same phase
    const currentTask = await prisma.task.findUnique({
      where: { id: interrogation.checkin.taskId },
      include: { phase: { include: { tasks: { orderBy: { sortOrder: "asc" } } } } },
    });

    if (currentTask) {
      const tasks = currentTask.phase.tasks;
      const currentIndex = tasks.findIndex((t) => t.id === currentTask.id);
      if (currentIndex >= 0 && currentIndex < tasks.length - 1) {
        const nextTask = tasks[currentIndex + 1];
        if (nextTask.status === "locked") {
          await prisma.task.update({
            where: { id: nextTask.id },
            data: { status: "available" },
          });
        }
      }
    }

    // Update streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const streak = await prisma.streak.findUnique({
      where: { userId_roadmapId: { userId: session.user.id, roadmapId: interrogation.checkin.roadmapId } },
    });

    if (streak) {
      const lastCheckin = streak.lastCheckin ? new Date(streak.lastCheckin) : null;
      if (lastCheckin) lastCheckin.setHours(0, 0, 0, 0);

      const continuesStreak = lastCheckin?.getTime() === yesterday.getTime();
      const newCurrent = continuesStreak ? streak.current + 1 : 1;

      await prisma.streak.update({
        where: { id: streak.id },
        data: {
          current: newCurrent,
          best: Math.max(streak.best, newCurrent),
          lastCheckin: new Date(),
        },
      });
    }
  } else {
    // Failed — check if phase wipe needed (3 failures this month)
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyFailures = await prisma.checkin.count({
      where: {
        userId: session.user.id,
        roadmapId: interrogation.checkin.roadmapId,
        status: "failed",
        createdAt: { gte: monthStart },
      },
    });

    if (monthlyFailures >= 3) {
      // Log phase wipe — client will animate it
      const task = await prisma.task.findUnique({
        where: { id: interrogation.checkin.taskId },
        include: { phase: { include: { tasks: true } } },
      });

      if (task) {
        await prisma.phaseWipe.create({
          data: { userId: session.user.id, phaseId: task.phaseId, reason: "3 failures in month" },
        });

        // Reset all verified tasks in this phase
        await prisma.task.updateMany({
          where: { phaseId: task.phaseId, status: "verified" },
          data: { status: "available", verifiedAt: null },
        });
      }
    }

    // Break streak
    await prisma.streak.updateMany({
      where: { userId: session.user.id, roadmapId: interrogation.checkin.roadmapId },
      data: { current: 0 },
    });
  }

  return NextResponse.json({
    correct,
    correctAnswer: questionData.correctAnswer,
    explanation: questionData.explanation,
    completed: true,
    passed,
    correctCount,
    scores,
    verdict,
  });
}
