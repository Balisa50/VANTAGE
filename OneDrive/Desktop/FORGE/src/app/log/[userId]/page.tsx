import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Flame, CheckCircle2, XCircle, ExternalLink, Shield, Calendar } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, isPublic: true } });
  if (!user || !user.isPublic) return { title: "Build Log — The Forge" };
  return {
    title: `${user.name}'s Build Log — The Forge`,
    description: `Follow ${user.name}'s learning journey on The Forge — verified daily check-ins, AI interrogations, and real project evidence.`,
  };
}

export default async function BuildLogPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      bio: true,
      github: true,
      linkedin: true,
      isPublic: true,
      integrityScore: true,
      createdAt: true,
      role: true,
    },
  });

  if (!user || !user.isPublic) notFound();

  const checkins = await prisma.checkin.findMany({
    where: { userId, status: "passed" },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      task: { select: { title: true, milestone: true } },
      track: { select: { title: true, color: true } },
      interrogation: { select: { passed: true, overallScore: true, feedback: true } },
    },
  });

  const roadmaps = await prisma.roadmap.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      tracks: {
        include: {
          phases: {
            include: { tasks: { select: { status: true } } },
          },
        },
      },
    },
  });

  const joinedDate = new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const totalPassed = checkins.length;
  const avgScore = checkins.reduce((sum, c) => sum + (c.interrogation?.overallScore ?? 0), 0) / (totalPassed || 1);

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
      {/* Nav bar */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent)", fontFamily: "var(--font-headline)", fontSize: "1.125rem" }}>
          <Flame size={18} /> THE FORGE
        </Link>
        <Link href="/login" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--blue)", textDecoration: "none" }}>
          Sign In
        </Link>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        {/* Profile header */}
        <div className="forge-panel" style={{ padding: "2rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5rem", flexWrap: "wrap" }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "50%",
              background: "rgba(245,158,11,0.1)", border: "2px solid rgba(245,158,11,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-headline)", fontSize: "1.75rem", color: "var(--accent)", flexShrink: 0,
            }}>
              {user.name[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: "var(--font-headline)", fontSize: "1.75rem", marginBottom: "0.25rem" }}>{user.name}</h1>
              {user.bio && (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.6, marginBottom: "0.75rem" }}>{user.bio}</p>
              )}
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <Calendar size={11} /> Forging since {joinedDate}
                </div>
                {user.integrityScore > 0 && (
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--blue)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Shield size={11} /> Integrity {user.integrityScore}
                  </div>
                )}
                {user.github && (
                  <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--blue)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    GitHub <ExternalLink size={10} />
                  </a>
                )}
                {user.linkedin && (
                  <a href={`https://linkedin.com/in/${user.linkedin}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--blue)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    LinkedIn <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
            {[
              { label: "Verified Sessions", value: totalPassed.toString() },
              { label: "Avg Score", value: `${avgScore.toFixed(1)}/30` },
              { label: "Roadmaps", value: roadmaps.length.toString() },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-headline)", fontSize: "1.75rem", color: "var(--accent)", marginBottom: "0.125rem" }}>{value}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "var(--text-dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap progress */}
        {roadmaps.length > 0 && (
          <div className="forge-panel" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
            <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "1.125rem", marginBottom: "1.25rem" }}>Roadmaps</h2>
            {roadmaps.map((roadmap) => {
              const allTasks = roadmap.tracks.flatMap((t) => t.phases.flatMap((p) => p.tasks));
              const verified = allTasks.filter((t) => t.status === "verified").length;
              const total = allTasks.length;
              const pct = total > 0 ? Math.round((verified / total) * 100) : 0;
              return (
                <div key={roadmap.id} style={{ marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                    <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.9375rem" }}>{roadmap.title}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)" }}>{pct}% · {verified}/{total} tasks</span>
                  </div>
                  <div style={{ height: "5px", background: "var(--border)", borderRadius: "3px" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: "3px" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Build log timeline */}
        <div>
          <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            Build Log
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-dim)", letterSpacing: "0.1em" }}>
              ({totalPassed} verified)
            </span>
          </h2>

          {checkins.length === 0 ? (
            <div className="forge-panel" style={{ padding: "3rem", textAlign: "center", color: "var(--text-dim)" }}>
              No verified sessions yet.
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              {/* Timeline line */}
              <div style={{ position: "absolute", left: "19px", top: "24px", bottom: "24px", width: "1px", background: "var(--border)" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {checkins.map((checkin) => {
                  const score = checkin.interrogation?.overallScore ?? 0;
                  const passed = checkin.interrogation?.passed ?? false;
                  const date = new Date(checkin.createdAt);
                  const formattedDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

                  return (
                    <div key={checkin.id} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                      {/* Timeline dot */}
                      <div style={{
                        width: "40px", height: "40px", borderRadius: "50%",
                        background: passed ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                        border: `2px solid ${passed ? "var(--green)" : "var(--red)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, zIndex: 1,
                      }}>
                        {passed
                          ? <CheckCircle2 size={16} color="var(--green)" />
                          : <XCircle size={16} color="var(--red)" />
                        }
                      </div>

                      {/* Card */}
                      <div className="forge-card" style={{ flex: 1, padding: "1rem 1.25rem", marginBottom: "0" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          <div>
                            <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.125rem" }}>
                              {checkin.task.title}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                              <span style={{
                                fontFamily: "var(--font-mono)", fontSize: "0.5625rem", letterSpacing: "0.1em", textTransform: "uppercase",
                                padding: "0.125rem 0.5rem", borderRadius: "3px",
                                background: `${checkin.track.color}15`, color: checkin.track.color,
                                border: `1px solid ${checkin.track.color}30`,
                              }}>
                                {checkin.track.title}
                              </span>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-dim)" }}>
                                {formattedDate}
                              </span>
                            </div>
                          </div>
                          <div style={{
                            fontFamily: "var(--font-headline)", fontSize: "1.25rem",
                            color: score >= 20 ? "var(--green)" : score >= 12 ? "var(--yellow)" : "var(--red)",
                            flexShrink: 0,
                          }}>
                            {score.toFixed(0)}/30
                          </div>
                        </div>

                        <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", lineHeight: 1.6, marginBottom: "0.625rem" }}>
                          {checkin.description.slice(0, 180)}{checkin.description.length > 180 ? "..." : ""}
                        </p>

                        {checkin.evidenceUrl && (
                          <a
                            href={checkin.evidenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--blue)", textDecoration: "none" }}
                          >
                            <ExternalLink size={11} />
                            {checkin.evidenceUrl.replace(/^https?:\/\//, "").slice(0, 50)}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{ marginTop: "3rem", padding: "2rem", textAlign: "center", background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: "12px" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", marginBottom: "1.25rem" }}>
            Want to build a verified track record like this?
          </p>
          <Link href="/signup" className="forge-btn forge-btn-primary" style={{ padding: "0.875rem 2.5rem", textDecoration: "none" }}>
            Join The Forge →
          </Link>
        </div>
      </div>
    </div>
  );
}
