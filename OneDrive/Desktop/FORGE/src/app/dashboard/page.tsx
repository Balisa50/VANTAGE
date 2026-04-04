import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getIntegrityBadge } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, MapIcon } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [user, activeRoadmap] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, integrityScore: true, tier: true },
    }),
    prisma.roadmap.findFirst({
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
        streaks: { where: { userId } },
        checkins: {
          orderBy: { createdAt: "desc" },
          take: 7,
          include: { interrogation: true },
        },
      },
    }),
  ]);

  const streak = activeRoadmap?.streaks[0];
  const recentCheckins = activeRoadmap?.checkins ?? [];
  const integrity = user?.integrityScore ?? 100;
  const badge = getIntegrityBadge(integrity);

  // Check if checked in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkedInToday = recentCheckins.some((c) => {
    const d = new Date(c.createdAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-headline)", fontSize: "2.5rem", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
          Welcome Back, {user?.name?.split(" ")[0]}
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Current Streak", value: streak?.current ?? 0, unit: "days", color: "var(--orange)" },
          { label: "Best Streak", value: streak?.best ?? 0, unit: "days", color: "var(--yellow)" },
          { label: "Integrity", value: integrity, unit: "/100", color: integrity >= 80 ? "var(--green)" : integrity >= 50 ? "var(--yellow)" : "var(--red)" },
          { label: "Check-ins", value: recentCheckins.filter((c) => c.status === "passed").length, unit: "passed", color: "var(--blue)" },
        ].map((stat) => (
          <div key={stat.label} className="forge-panel" style={{ padding: "1.25rem" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-dim)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem" }}>{stat.label}</div>
            <div style={{ fontFamily: "var(--font-headline)", fontSize: "2rem", color: stat.color, lineHeight: 1 }}>
              {stat.value}<span style={{ fontSize: "0.875rem", color: "var(--text-dim)", marginLeft: "0.25rem" }}>{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Check-in CTA */}
      {!checkedInToday && activeRoadmap && (
        <div
          className="forge-panel"
          style={{ padding: "1.5rem", marginBottom: "2rem", borderColor: "var(--red)", background: "rgba(255,45,45,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}
        >
          <div>
            <div style={{ fontFamily: "var(--font-headline)", fontSize: "1.125rem", fontWeight: 700, color: "var(--red)", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <AlertTriangle size={18} /> Check-in Required
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>You haven&apos;t checked in today. Complete your session before midnight.</div>
          </div>
          <Link href="/dashboard/checkin" className="forge-btn forge-btn-primary">Start Check-in</Link>
        </div>
      )}

      {checkedInToday && (
        <div className="forge-panel" style={{ padding: "1.5rem", marginBottom: "2rem", borderColor: "var(--green)", background: "rgba(34,197,94,0.05)", display: "flex", alignItems: "center", gap: "1rem" }}>
          <CheckCircle2 size={28} color="var(--green)" strokeWidth={1.5} />
          <div>
            <div style={{ fontFamily: "var(--font-headline)", fontSize: "1.125rem", fontWeight: 700, color: "var(--green)" }}>Today&apos;s Session Complete</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>You proved your work today. Come back tomorrow.</div>
          </div>
        </div>
      )}

      {!activeRoadmap && (
        <div className="forge-panel" style={{ padding: "1.5rem", marginBottom: "2rem", borderColor: "var(--blue)", background: "rgba(0,200,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontFamily: "var(--font-headline)", fontSize: "1.125rem", fontWeight: 700, color: "var(--blue)", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <MapIcon size={18} /> No Active Roadmap
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Create your first roadmap to begin your journey.</div>
          </div>
          <Link href="/dashboard/roadmap" className="forge-btn forge-btn-blue">Create Roadmap</Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Roadmap */}
        {activeRoadmap && (
          <div className="forge-panel" style={{ padding: "1.5rem" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "1.25rem", letterSpacing: "0.05em" }}>{activeRoadmap.title}</h2>
              <Link href="/dashboard/roadmap" style={{ color: "var(--blue)", fontSize: "0.8125rem", fontFamily: "var(--font-mono)" }}>View All →</Link>
            </div>
            {activeRoadmap.tracks.slice(0, 2).map((track) => {
              const totalTasks = track.phases.reduce((sum, p) => sum + p.tasks.length, 0);
              const doneTasks = track.phases.reduce((sum, p) => sum + p.tasks.filter((t) => t.status === "verified").length, 0);
              const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
              return (
                <div key={track.id} style={{ marginBottom: "1rem" }}>
                  <div className="flex justify-between items-center mb-1">
                    <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.9375rem" }}>{track.title}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)" }}>{doneTasks}/{totalTasks}</span>
                  </div>
                  <div style={{ height: "4px", background: "var(--border)", borderRadius: "2px" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: track.color, borderRadius: "2px", transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent Sessions */}
        <div className="forge-panel" style={{ padding: "1.5rem" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "1.25rem", letterSpacing: "0.05em" }}>Recent Sessions</h2>
            <Link href="/dashboard/journal" style={{ color: "var(--blue)", fontSize: "0.8125rem", fontFamily: "var(--font-mono)" }}>Journal →</Link>
          </div>
          {recentCheckins.length === 0 ? (
            <p style={{ color: "var(--text-dim)", fontSize: "0.875rem" }}>No sessions yet. Complete your first check-in.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentCheckins.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between" style={{ padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.9375rem" }}>{new Date(c.createdAt).toLocaleDateString()}</div>
                    <div style={{ color: "var(--text-dim)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>{c.description.slice(0, 50)}...</div>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: c.status === "passed" ? "var(--green)" : c.status === "failed" ? "var(--red)" : "var(--yellow)", textTransform: "uppercase" }}>
                    {c.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Integrity Log */}
        <div className="forge-panel" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "1.25rem", letterSpacing: "0.05em", marginBottom: "1rem" }}>Integrity</h2>
          <div className="flex items-end gap-4 mb-4">
            <div style={{ fontFamily: "var(--font-headline)", fontSize: "3.5rem", lineHeight: 1, color: badge.color }}>{integrity}</div>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: badge.color, letterSpacing: "0.1em" }}>{badge.label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-dim)" }}>out of 100</div>
            </div>
          </div>
          <div style={{ height: "6px", background: "var(--border)", borderRadius: "3px", marginBottom: "1rem" }}>
            <div style={{ height: "100%", width: `${integrity}%`, background: integrity >= 80 ? "var(--green)" : integrity >= 50 ? "var(--yellow)" : "var(--red)", borderRadius: "3px", transition: "width 0.5s" }} />
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
            {integrity >= 80 ? "Excellent standing. Keep it clean." : integrity >= 50 ? "Warning territory. Stop the bleeding." : "Critical. Certificate may be flagged."}
          </p>
        </div>
      </div>
    </div>
  );
}
