import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, MapIcon, Zap, ArrowRight, Clock, Building2, Shield, Target, Flame } from "lucide-react";

function getDaysRemaining(targetDate: Date | null | undefined): number | null {
  if (!targetDate) return null;
  const now = new Date();
  return Math.ceil((new Date(targetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getRecommendedPace(remainingTasks: number, daysLeft: number | null): string | null {
  if (daysLeft === null || daysLeft <= 0 || remainingTasks === 0) return null;
  const perDay = remainingTasks / daysLeft;
  return perDay <= 1 ? "~1 task/day" : `~${Math.ceil(perDay)} tasks/day`;
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  // Single query to get user data + role check (avoids extra round-trip)
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, role: true, isAlsoLearning: true, integrityScore: true, createdAt: true },
  });

  // Role-based redirect: mentors (who don't learn) and admins get their own dashboards
  if (dbUser?.role === "mentor" && !dbUser.isAlsoLearning) redirect("/dashboard/mentor");
  if (dbUser?.role === "bootcamp") redirect("/dashboard/org");

  const isStudent = dbUser?.role === "student";
  const isMentorLearner = dbUser?.role === "mentor" && dbUser.isAlsoLearning;

  // Combine remaining queries in parallel (user data already fetched above)
  const [activeRoadmap, orgMembership] = await Promise.all([
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
        checkins: {
          orderBy: { createdAt: "desc" },
          take: 7,
          include: { interrogation: true },
        },
      },
    }),
    // Only fetch org data for students
    isStudent
      ? prisma.orgMembership.findFirst({
          where: { userId },
          include: {
            org: { select: { name: true } },
          },
        })
      : Promise.resolve(null),
  ]);

  const user = dbUser;

  const recentCheckins = activeRoadmap?.checkins ?? [];

  // Check if checked in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkedInToday = recentCheckins.some((c) => {
    const d = new Date(c.createdAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  // Re-entry flow: detect if user has been absent 3+ days
  const lastCheckin = recentCheckins.find((c) => c.status === "passed");
  const daysSinceLastCheckin = lastCheckin
    ? Math.floor((Date.now() - new Date(lastCheckin.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isReturning = daysSinceLastCheckin !== null && daysSinceLastCheckin >= 3;

  // Find the current task (first non-verified, non-locked task)
  const currentTask = activeRoadmap?.tracks
    .flatMap((t) => t.phases.flatMap((p) => p.tasks.map((task) => ({ ...task, trackTitle: t.title, trackColor: t.color, phaseTitle: p.title }))))
    .find((t) => t.status === "in_progress" || t.status === "available");

  // Compute overall roadmap progress
  const allTasks = activeRoadmap?.tracks.flatMap((t) => t.phases.flatMap((p) => p.tasks)) ?? [];
  const verifiedTasks = allTasks.filter((t) => t.status === "verified").length;
  const totalTasks = allTasks.length;
  const overallPct = totalTasks > 0 ? Math.round((verifiedTasks / totalTasks) * 100) : 0;

  // Not used — analytics page handles detailed scores

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

      {/* Re-entry: Welcome back after 3+ days absence */}
      {isReturning && !checkedInToday && (
        <div
          className="forge-panel"
          style={{ padding: "1.5rem", marginBottom: "1.5rem", borderColor: "var(--accent)", background: "rgba(245,158,11,0.04)" }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Flame size={22} color="var(--accent)" strokeWidth={1.5} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-headline)", fontSize: "1.25rem", marginBottom: "0.25rem" }}>
                Welcome back, {user?.name?.split(" ")[0]}.
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.6, marginBottom: "0.25rem" }}>
                It&apos;s been {daysSinceLastCheckin} day{daysSinceLastCheckin === 1 ? "" : "s"} since your last verified session.
                {" "}Life happens — that&apos;s what grace days are for.
                The path is still here. Your next task is waiting.
              </p>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)" }}>
                {lastCheckin && `Last session: ${new Date(lastCheckin.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Check-in CTA */}
      {!checkedInToday && activeRoadmap && (
        <div
          className="forge-panel"
          style={{ padding: "1.5rem", marginBottom: "1.5rem", borderColor: "var(--red)", background: "rgba(255,45,45,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}
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
        <div className="forge-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem", borderColor: "var(--green)", background: "rgba(34,197,94,0.05)", display: "flex", alignItems: "center", gap: "1rem" }}>
          <CheckCircle2 size={28} color="var(--green)" strokeWidth={1.5} />
          <div>
            <div style={{ fontFamily: "var(--font-headline)", fontSize: "1.125rem", fontWeight: 700, color: "var(--green)" }}>Today&apos;s Session Complete</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>You proved your work today. Come back tomorrow.</div>
          </div>
        </div>
      )}

      {/* Student: Org context */}
      {isStudent && orgMembership && (
        <div className="forge-panel" style={{ padding: "1rem 1.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: "36px", height: "36px", borderRadius: "8px",
              background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-headline)", fontSize: "0.875rem", color: "var(--green)",
            }}>
              <Building2 size={16} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.9375rem" }}>{orgMembership.org.name}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Your Organization</div>
            </div>
          </div>
          <Link href="/dashboard/org" style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "var(--blue)", display: "flex", alignItems: "center", gap: "0.25rem", textDecoration: "none" }}>
            View Org <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Integrity Score (for students) */}
      {isStudent && user && user.integrityScore < 80 && (
        <div className="forge-panel" style={{ padding: "1rem 1.5rem", marginBottom: "1.5rem", borderColor: user.integrityScore < 50 ? "var(--red)" : "var(--yellow)", background: user.integrityScore < 50 ? "rgba(255,45,45,0.04)" : "rgba(234,179,8,0.04)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Shield size={16} color={user.integrityScore < 50 ? "var(--red)" : "var(--yellow)"} />
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.875rem", color: user.integrityScore < 50 ? "var(--red)" : "var(--yellow)" }}>
              Integrity: {user.integrityScore}%
            </span>
            <span style={{ color: "var(--text-dim)", fontSize: "0.8125rem", marginLeft: "0.5rem" }}>
              {user.integrityScore < 50 ? "Your mentor and org can see this." : "Keep proving your work to raise it."}
            </span>
          </div>
          <Link href="/dashboard/analytics" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--blue)", textDecoration: "none" }}>View</Link>
        </div>
      )}

      {!activeRoadmap && (
        <div className="forge-panel" style={{ padding: "3rem", marginBottom: "1.5rem", textAlign: "center" }}>
          <div style={{ color: "var(--accent)", marginBottom: "1rem", display: "flex", justifyContent: "center" }}><MapIcon size={48} strokeWidth={1.5} /></div>
          <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "1.75rem", marginBottom: "0.5rem" }}>No Active Roadmap</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", marginBottom: "2rem", maxWidth: "400px", margin: "0 auto 2rem" }}>
            Create your learning roadmap to begin. The AI will generate a structured curriculum with real resources.
          </p>
          <Link href="/dashboard/roadmap" className="forge-btn forge-btn-primary" style={{ padding: "0.75rem 2rem" }}>Create Roadmap</Link>
        </div>
      )}

      {activeRoadmap && (
        <>
          {/* Progress + Deadline — compact row */}
          {(() => {
            const daysLeft = getDaysRemaining(activeRoadmap.targetDate);
            const remainingTasks = totalTasks - verifiedTasks;
            const pace = getRecommendedPace(remainingTasks, daysLeft);
            return (
              <div className="forge-panel" style={{ padding: "1.25rem 1.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
                {/* Progress */}
                <div style={{ flex: 1, minWidth: "140px" }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: "0.25rem" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "var(--text-dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Progress</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-secondary)" }}>{verifiedTasks}/{totalTasks} · {overallPct}%</span>
                  </div>
                  <div style={{ height: "5px", background: "var(--border)", borderRadius: "3px" }}>
                    <div style={{ height: "100%", width: `${overallPct}%`, background: "var(--accent)", borderRadius: "3px", transition: "width 0.5s" }} />
                  </div>
                </div>

                {/* Deadline */}
                {daysLeft !== null && (
                  <>
                    <div style={{ width: "1px", height: "28px", background: "var(--border)" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Target size={16} color={daysLeft <= 7 ? "var(--red)" : daysLeft <= 21 ? "var(--yellow)" : "var(--text-dim)"} />
                      <div>
                        <div style={{ fontFamily: "var(--font-headline)", fontSize: "1.125rem", color: daysLeft <= 0 ? "var(--red)" : daysLeft <= 7 ? "var(--red)" : daysLeft <= 21 ? "var(--yellow)" : "var(--text-primary)" }}>
                          {daysLeft <= 0 ? "OVERDUE" : `${daysLeft}d`}
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", color: "var(--text-dim)", letterSpacing: "0.05em" }}>
                          {pace ?? "LEFT"}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* Current Focus — full width, most important card */}
          {currentTask && (
            <div className="forge-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
              <div className="flex items-center gap-2 mb-4">
                <Zap size={16} color="var(--accent)" strokeWidth={2} />
                <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "1.125rem", letterSpacing: "0.05em" }}>Current Focus</h2>
              </div>
              <div style={{ borderLeft: `3px solid ${currentTask.trackColor}`, paddingLeft: "1rem", marginBottom: "1rem" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: currentTask.trackColor, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.375rem" }}>
                  {currentTask.trackTitle} → {currentTask.phaseTitle}
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "1.0625rem", marginBottom: "0.5rem" }}>
                  {currentTask.title}
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                  {currentTask.detail}
                </p>
                {currentTask.estimatedHours && (
                  <div className="flex items-center gap-1 mt-3" style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                    <Clock size={12} /> ~{currentTask.estimatedHours}h estimated
                  </div>
                )}
              </div>
              <Link href="/dashboard/checkin" className="forge-btn forge-btn-primary" style={{ marginTop: "0.75rem", padding: "0.75rem 2rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                Check In <ArrowRight size={14} />
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Track Progress */}
            <div className="forge-panel" style={{ padding: "1.5rem" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "1.125rem", letterSpacing: "0.05em" }}>{activeRoadmap.title}</h2>
                <Link href="/dashboard/roadmap" style={{ color: "var(--blue)", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", gap: "0.25rem" }}>View <ArrowRight size={12} /></Link>
              </div>
              {activeRoadmap.tracks.map((track) => {
                const total = track.phases.reduce((sum, p) => sum + p.tasks.length, 0);
                const done = track.phases.reduce((sum, p) => sum + p.tasks.filter((t) => t.status === "verified").length, 0);
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div key={track.id} style={{ marginBottom: "1.25rem" }}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: track.color }} />
                        <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.9375rem" }}>{track.title}</span>
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)" }}>{pct}%</span>
                    </div>
                    <div style={{ height: "4px", background: "var(--border)", borderRadius: "2px" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: track.color, borderRadius: "2px", transition: "width 0.5s" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Sessions */}
            <div className="forge-panel" style={{ padding: "1.5rem" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "1.125rem", letterSpacing: "0.05em" }}>Recent Sessions</h2>
                <Link href="/dashboard/journal" style={{ color: "var(--blue)", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", gap: "0.25rem" }}>Journal <ArrowRight size={12} /></Link>
              </div>
              {recentCheckins.length === 0 ? (
                <div style={{ color: "var(--text-dim)", fontSize: "0.875rem", padding: "1rem 0" }}>
                  No sessions yet. Complete your first check-in to see your history here.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {recentCheckins.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center justify-between" style={{ padding: "0.625rem 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.875rem" }}>{new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                        <div style={{ color: "var(--text-dim)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.description.slice(0, 60)}</div>
                      </div>
                      <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
                        {c.interrogation && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: c.interrogation.passed ? "var(--green)" : "var(--red)" }}>
                            {c.interrogation.overallScore.toFixed(1)}
                          </span>
                        )}
                        <div style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.6875rem",
                          padding: "0.125rem 0.5rem",
                          borderRadius: "4px",
                          background: c.status === "passed" ? "rgba(34,197,94,0.1)" : c.status === "failed" ? "rgba(239,68,68,0.1)" : "rgba(234,179,8,0.1)",
                          color: c.status === "passed" ? "var(--green)" : c.status === "failed" ? "var(--red)" : "var(--yellow)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}>
                          {c.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
