import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RoadmapView from "@/components/RoadmapView";
import Link from "next/link";

export default async function RoadmapPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const roadmap = await prisma.roadmap.findFirst({
    where: { userId, isActive: true },
    include: {
      tracks: {
        include: {
          phases: {
            include: {
              tasks: { orderBy: { sortOrder: "asc" } },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!roadmap) {
    return (
      <div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", marginBottom: "0.5rem" }}>Roadmap</h1>
        <div className="forge-panel" style={{ padding: "3rem", textAlign: "center", marginTop: "2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🗺️</div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.75rem", marginBottom: "1rem" }}>No Active Roadmap</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>Create a roadmap to structure your learning journey.</p>
          <form action="/api/roadmaps" method="post">
            <Link href="/onboarding" className="forge-btn forge-btn-primary">Create Roadmap</Link>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6" style={{ flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>{roadmap.title}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
            Started {new Date(roadmap.startedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href="/dashboard/checkin" className="forge-btn forge-btn-primary">Check In Today</Link>
      </div>

      <RoadmapView roadmap={roadmap} />
    </div>
  );
}
