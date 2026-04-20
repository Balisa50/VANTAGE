import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/guest/cleanup
 * Deletes the guest user and all their data (CASCADE handles relations).
 * Called on:
 *   - Tab close via navigator.sendBeacon (fires POST)
 *   - Manual "Exit" button click
 */
export async function POST() {
  return cleanup();
}

export async function DELETE() {
  return cleanup();
}

async function cleanup() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ ok: true });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isGuest: true },
    });

    if (user?.isGuest) {
      await prisma.user.delete({ where: { id: session.user.id } });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[guest/cleanup] error:", msg);
    return NextResponse.json({ ok: true }); // Always succeed — don't block the tab close
  }
}
