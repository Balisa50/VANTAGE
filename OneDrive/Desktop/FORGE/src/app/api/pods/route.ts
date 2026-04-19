import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/pods — return the current user's pod (if any) */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const membership = await prisma.podMember.findFirst({
    where: { userId, isActive: true },
    include: {
      pod: {
        include: {
          members: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  checkins: {
                    where: { status: "passed" },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: { createdAt: true },
                  },
                  roadmaps: {
                    where: { isActive: true },
                    select: {
                      title: true,
                      tracks: {
                        include: {
                          phases: {
                            include: { tasks: { select: { status: true } } },
                          },
                        },
                      },
                    },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!membership) return NextResponse.json({ pod: null });

  // Shape the response — compute progress for each member
  const members = membership.pod.members.map((m) => {
    const allTasks = m.user.roadmaps[0]?.tracks.flatMap((t) =>
      t.phases.flatMap((p) => p.tasks)
    ) ?? [];
    const verified = allTasks.filter((t) => t.status === "verified").length;
    const total = allTasks.length;
    const progress = total > 0 ? Math.round((verified / total) * 100) : 0;
    const lastCheckin = m.user.checkins[0]?.createdAt ?? null;
    return {
      userId: m.userId,
      name: m.user.name,
      roadmapTitle: m.user.roadmaps[0]?.title ?? null,
      progress,
      lastCheckin,
      isMe: m.userId === userId,
    };
  });

  return NextResponse.json({
    pod: {
      id: membership.pod.id,
      name: membership.pod.name,
      category: membership.pod.category,
      maxSize: membership.pod.maxSize,
      memberCount: members.length,
      members,
    },
  });
}

/** POST /api/pods — auto-match into a pod by roadmap category */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const body = await req.json().catch(() => ({}));
  const { category: requestedCategory } = body;

  // Must not already be in an active pod
  const existing = await prisma.podMember.findFirst({ where: { userId, isActive: true } });
  if (existing) return NextResponse.json({ error: "You are already in a pod." }, { status: 409 });

  // Determine category from active roadmap if not specified
  let category = requestedCategory ?? "General";
  if (!requestedCategory) {
    const roadmap = await prisma.roadmap.findFirst({ where: { userId, isActive: true }, select: { title: true } });
    if (roadmap) {
      const title = roadmap.title.toLowerCase();
      if (title.includes("react") || title.includes("vue") || title.includes("angular") || title.includes("frontend") || title.includes("javascript") || title.includes("typescript")) {
        category = "Frontend";
      } else if (title.includes("node") || title.includes("python") || title.includes("backend") || title.includes("api") || title.includes("java") || title.includes("go") || title.includes("rust")) {
        category = "Backend";
      } else if (title.includes("full stack") || title.includes("fullstack")) {
        category = "Full Stack";
      } else if (title.includes("devops") || title.includes("docker") || title.includes("kubernetes") || title.includes("aws") || title.includes("cloud")) {
        category = "DevOps & Cloud";
      } else if (title.includes("machine learning") || title.includes("data") || title.includes("ai") || title.includes("ml")) {
        category = "Data & AI";
      } else if (title.includes("mobile") || title.includes("android") || title.includes("flutter") || title.includes("react native")) {
        category = "Mobile";
      } else if (title.includes("blockchain") || title.includes("security") || title.includes("system design")) {
        category = "Speciality";
      }
    }
  }

  // Find an open pod in this category with room
  const openPod = await prisma.pod.findFirst({
    where: {
      category,
      isOpen: true,
      members: { some: { isActive: true } }, // has at least one active member
    },
    include: {
      _count: { select: { members: { where: { isActive: true } } } },
    },
    orderBy: { createdAt: "asc" }, // oldest first (fill existing pods)
  });

  let podId: string;

  if (openPod && openPod._count.members < openPod.maxSize) {
    podId = openPod.id;
    // Close pod if it hits max
    if (openPod._count.members + 1 >= openPod.maxSize) {
      await prisma.pod.update({ where: { id: podId }, data: { isOpen: false } });
    }
  } else {
    // Create a new pod
    const podNames = [
      `${category} Crew`, `${category} Squad`, `${category} Guild`,
      `${category} Pack`, `${category} Force`,
    ];
    const newPod = await prisma.pod.create({
      data: {
        name: podNames[Math.floor(Math.random() * podNames.length)],
        category,
        maxSize: 5,
        isOpen: true,
      },
    });
    podId = newPod.id;
  }

  await prisma.podMember.create({ data: { podId, userId } });

  return NextResponse.json({ success: true, podId }, { status: 201 });
}
