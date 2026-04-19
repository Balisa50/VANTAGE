import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCheckinReminderEmail } from "@/lib/email";

/**
 * Daily check-in reminder — runs at 20:00 UTC every day.
 * Sends reminders to users who:
 *   1. Have an active roadmap with a current task
 *   2. Have NOT checked in today
 *
 * Protected by CRON_SECRET (Vercel sets this automatically for cron routes,
 * or we check the Authorization header for manual invocations).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  // Find all users who have at least one roadmap with an available/in_progress task
  // and have NOT submitted a checkin today
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      roadmaps: {
        where: { isActive: true },
        select: {
          tracks: {
            select: {
              phases: {
                select: {
                  tasks: {
                    where: { status: { in: ["available", "in_progress"] } },
                    select: { title: true },
                    orderBy: { sortOrder: "asc" },
                    take: 1,
                  },
                },
              },
            },
          },
          checkins: {
            where: { createdAt: { gte: todayStart } },
            select: { id: true },
            take: 1,
          },
        },
        take: 1,
      },
    },
  });

  let sent = 0;
  const errors: string[] = [];

  for (const user of users) {
    const roadmap = user.roadmaps[0];
    if (!roadmap) continue;

    // Already checked in today
    if (roadmap.checkins.length > 0) continue;

    // Find the current task title
    const taskTitle =
      roadmap.tracks
        .flatMap((tr) => tr.phases.flatMap((ph) => ph.tasks))
        .find((t) => t?.title)?.title ?? "";

    if (!taskTitle) continue; // No active task — nothing to remind about

    try {
      await sendCheckinReminderEmail(user.email, user.name ?? "there", taskTitle);
      sent++;
    } catch (e) {
      errors.push(`${user.email}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({ ok: true, sent, errors: errors.length ? errors : undefined });
}
