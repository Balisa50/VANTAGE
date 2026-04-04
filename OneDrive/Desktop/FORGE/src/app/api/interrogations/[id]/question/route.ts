import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROFESSOR_SYSTEM_PROMPT, type MCQQuestion } from "@/lib/interrogation";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: interrogationId } = await params;
  const { questionNumber } = await req.json();

  // Load interrogation + checkin + task context
  const interrogation = await prisma.interrogation.findUnique({
    where: { id: interrogationId },
    include: {
      checkin: {
        include: {
          task: { include: { phase: { include: { track: true } } } },
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!interrogation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (interrogation.checkin.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { checkin } = interrogation;
  const task = checkin.task;
  const studentName = checkin.user.name;

  // Build evidence context from screenshot
  const evidenceData = checkin.evidenceData as Record<string, unknown> | null;
  const evidenceContext = evidenceData
    ? `Screenshot uploaded: ${evidenceData.filename ?? "screenshot"}. Size: ${evidenceData.size ?? "unknown"} bytes.`
    : "No evidence uploaded.";

  // Get previous session topics for anti-repetition
  const recentInterrogations = await prisma.interrogation.findMany({
    where: {
      checkin: {
        userId: session.user.id,
        trackId: checkin.trackId,
      },
      id: { not: interrogationId },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { transcript: true },
  });

  const previousTopics = recentInterrogations
    .flatMap((i) => {
      const t = i.transcript as Array<{ topic?: string }>;
      return t.map((q) => q.topic).filter(Boolean);
    })
    .slice(0, 20) as string[];

  const systemPrompt = PROFESSOR_SYSTEM_PROMPT(
    studentName,
    task.title,
    task.detail,
    checkin.description,
    evidenceContext,
    previousTopics,
  );

  // Build conversation history for this interrogation
  const transcript = interrogation.transcript as Array<{ role: string; content: string }>;
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...transcript.map((t) => ({ role: t.role as "user" | "assistant", content: t.content })),
    { role: "user", content: `Generate question number ${questionNumber} now. Return ONLY valid JSON.` },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content ?? "{}";
    const question = JSON.parse(content) as MCQQuestion;

    // Validate required fields
    if (!question.question || !question.options || !question.correctAnswer) {
      return NextResponse.json({ error: "Invalid question format from AI" }, { status: 500 });
    }

    // Save question to transcript (without correct answer — client never sees it)
    const updatedTranscript = [
      ...transcript,
      {
        role: "assistant",
        content,
        questionNumber,
        topic: question.topic,
      },
    ];

    await prisma.interrogation.update({
      where: { id: interrogationId },
      data: {
        transcript: updatedTranscript,
        tokensUsed: { increment: completion.usage?.total_tokens ?? 0 },
      },
    });

    // Return question WITHOUT correct answer
    return NextResponse.json({
      question: {
        questionNumber: question.questionNumber,
        type: question.type,
        question: question.question,
        options: question.options,
        topic: question.topic,
        // correctAnswer is intentionally NOT returned to client
      },
    });
  } catch (err) {
    console.error("OpenAI error:", err);
    return NextResponse.json({ error: "AI service error" }, { status: 503 });
  }
}
