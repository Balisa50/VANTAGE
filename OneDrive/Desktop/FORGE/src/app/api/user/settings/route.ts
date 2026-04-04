import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, timezone } = body;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
  }

  const VALID_TIMEZONES = Intl.supportedValuesOf?.("timeZone") ?? [];
  if (timezone && VALID_TIMEZONES.length > 0 && !VALID_TIMEZONES.includes(timezone)) {
    return NextResponse.json({ error: "Invalid timezone." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name.trim(),
      ...(timezone ? { timezone } : {}),
    },
    select: { id: true, name: true, timezone: true },
  });

  return NextResponse.json(updated);
}
