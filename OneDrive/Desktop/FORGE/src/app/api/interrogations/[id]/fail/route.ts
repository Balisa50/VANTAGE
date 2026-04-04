import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const INTEGRITY_DEDUCTIONS: Record<string, number> = {
  tab_switch: 5,
  copy_paste: 10,
  devtools: 15,
  fast_pass: 10,
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: interrogationId } = await params;
  const { reason } = await req.json();

  const interrogation = await prisma.interrogation.findUnique({
    where: { id: interrogationId },
    include: { checkin: { select: { userId: true, id: true } } },
  });

  if (!interrogation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (interrogation.checkin.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const deduction = INTEGRITY_DEDUCTIONS[reason] ?? 5;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { integrityScore: true },
  });

  const currentScore = user?.integrityScore ?? 100;
  const newScore = Math.max(0, currentScore - deduction);

  await Promise.all([
    prisma.interrogation.update({
      where: { id: interrogationId },
      data: {
        passed: false,
        completedAt: new Date(),
        antiCheatFlags: { push: { reason, detectedAt: new Date().toISOString() } },
      },
    }),
    prisma.checkin.update({
      where: { id: interrogation.checkinId },
      data: { status: "failed" },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { integrityScore: newScore },
    }),
    prisma.integrityLog.create({
      data: {
        userId: session.user.id,
        event: reason,
        description: `Auto-fail: ${reason.replace(/_/g, " ")} during interrogation`,
        scoreBefore: currentScore,
        scoreAfter: newScore,
        delta: -deduction,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
