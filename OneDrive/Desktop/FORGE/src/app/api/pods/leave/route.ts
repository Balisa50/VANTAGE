import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const membership = await prisma.podMember.findFirst({ where: { userId, isActive: true } });
  if (!membership) return NextResponse.json({ error: "Not in a pod" }, { status: 404 });

  // Mark member inactive
  await prisma.podMember.update({ where: { id: membership.id }, data: { isActive: false } });

  // Re-open pod if it was full
  const remaining = await prisma.podMember.count({ where: { podId: membership.podId, isActive: true } });
  if (remaining < 5) {
    await prisma.pod.update({ where: { id: membership.podId }, data: { isOpen: true } });
  }

  return NextResponse.json({ success: true });
}
