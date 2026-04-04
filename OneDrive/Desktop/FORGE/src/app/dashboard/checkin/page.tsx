import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CheckinForm from "@/components/CheckinForm";
import Link from "next/link";

export default async function CheckinPage() {
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
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🗺️</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", marginBottom: "1rem" }}>No Active Roadmap</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>Create a roadmap first before checking in.</p>
        <Link href="/dashboard/roadmap" className="forge-btn forge-btn-primary">Create Roadmap</Link>
      </div>
    );
  }

  // Check if already checked in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayCheckin = await prisma.checkin.findFirst({
    where: {
      userId,
      roadmapId: roadmap.id,
      createdAt: { gte: today, lt: tomorrow },
      status: { in: ["passed"] },
    },
  });

  if (todayCheckin) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", marginBottom: "1rem" }}>Already Checked In Today</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>You passed today&apos;s interrogation. Come back tomorrow.</p>
        <Link href="/dashboard" className="forge-btn forge-btn-ghost">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", marginBottom: "0.5rem" }}>Daily Check-In</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>Submit your proof of work and face The Professor.</p>
      <CheckinForm roadmap={roadmap} userId={userId} userName={session!.user!.name ?? "Student"} />
    </div>
  );
}
