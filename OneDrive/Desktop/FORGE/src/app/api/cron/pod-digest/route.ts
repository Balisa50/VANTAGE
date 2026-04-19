import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPodActivityEmail } from "@/lib/email";

/**
 * Weekly pod digest — runs at 09:00 UTC every Monday.
 * For each pod with ≥2 active members, sends each member a summary
 * of their pod's check-in activity over the past 7 days.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const pods = await prisma.pod.findMany({
    where: {
      members: { some: { isActive: true } },
    },
    include: {
      members: {
        where: { isActive: true },
        include: {
          user: {
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
                          tasks: { select: { status: true } },
                        },
                      },
                    },
                  },
                  checkins: {
                    where: { createdAt: { gte: weekAgo }, status: "passed" },
                    select: { id: true, createdAt: true },
                  },
                },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  let sent = 0;
  const errors: string[] = [];

  for (const pod of pods) {
    const activeMembers = pod.members.filter((m) => m.isActive);
    if (activeMembers.length < 2) continue;

    // Build member summaries
    const memberSummaries = activeMembers.map((m) => {
      const roadmap = m.user.roadmaps[0];
      const allTasks = roadmap?.tracks.flatMap((tr) => tr.phases.flatMap((ph) => ph.tasks)) ?? [];
      const verifiedCount = allTasks.filter((t) => t.status === "verified").length;
      const progress = allTasks.length > 0 ? Math.round((verifiedCount / allTasks.length) * 100) : 0;
      const checkedInThisWeek = (roadmap?.checkins.length ?? 0) > 0;
      return {
        name: m.user.name ?? "Anonymous",
        checkedIn: checkedInThisWeek,
        progress,
      };
    });

    // Send to every active member
    for (const m of activeMembers) {
      try {
        await sendPodActivityEmail(
          m.user.email,
          m.user.name ?? "there",
          pod.name,
          memberSummaries,
        );
        sent++;
      } catch (e) {
        errors.push(`${m.user.email}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  return NextResponse.json({ ok: true, sent, errors: errors.length ? errors : undefined });
}
