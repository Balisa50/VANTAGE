import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CalendarGrid from "@/components/CalendarGrid";

export default async function CalendarPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  // Get checkins for the last 90 days
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const checkins = await prisma.checkin.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { createdAt: true, status: true },
    orderBy: { createdAt: "asc" },
  });

  const checkinMap: Record<string, string> = {};
  for (const c of checkins) {
    const key = c.createdAt.toISOString().split("T")[0];
    // passed > failed > grace
    if (!checkinMap[key] || c.status === "passed") {
      checkinMap[key] = c.status;
    }
  }

  return (
    <div>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", marginBottom: "0.5rem" }}>Calendar</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>Your accountability history at a glance.</p>

      <div className="forge-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div className="flex gap-4 flex-wrap">
          {[
            { color: "var(--green)", label: "Passed" },
            { color: "var(--red)", label: "Failed" },
            { color: "var(--yellow)", label: "Grace Day" },
            { color: "var(--blue)", label: "Respite" },
            { color: "var(--border)", label: "No Check-in" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: item.color, flexShrink: 0 }} />
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.75rem", color: "var(--text-secondary)" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <CalendarGrid checkinMap={checkinMap} />
    </div>
  );
}
