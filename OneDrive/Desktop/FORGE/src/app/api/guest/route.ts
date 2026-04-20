import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * POST /api/guest
 * Creates a temporary guest user and returns their credentials so the
 * client can sign them in via NextAuth credentials provider.
 * Guest data is wiped when they exit via /api/guest/cleanup.
 */
export async function POST() {
  try {
    const uid = Math.random().toString(36).slice(2, 10);
    const email = `guest_${uid}@forge.guest`;
    const password = Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2, 10);
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        name: "Guest",
        passwordHash,
        isGuest: true,
        onboardingDone: false,
      },
    });

    return NextResponse.json({ email, password });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[guest] create error:", msg);
    return NextResponse.json({ error: "Failed to create guest session" }, { status: 500 });
  }
}
