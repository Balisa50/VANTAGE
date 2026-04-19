import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Shield, Trophy, Zap, CheckCircle2 } from "lucide-react";

export const metadata = { title: "Leaderboard | THE FORGE" };

export default async function LeaderboardPage() {
  const session = await auth();
  const currentUserId = session?.user?.id;

  // Top builders by integrity score — only public profiles
  const topBuilders = await prisma.user.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      name: true,
      integrityScore: true,
      createdAt: true,
      roadmaps: {
        where: { isActive: true },
        select: {
          title: true,
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
            where: { status: "passed" },
            select: { id: true },
          },
        },
        take: 1,
      },
    },
    orderBy: { integrityScore: "desc" },
    take: 50,
  });

  // Also fetch current user even if not public so they can see their own rank
  const currentUserData = currentUserId
    ? await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          name: true,
          integrityScore: true,
          isPublic: true,
          roadmaps: {
            where: { isActive: true },
            select: {
              title: true,
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
                where: { status: "passed" },
                select: { id: true },
              },
            },
            take: 1,
          },
        },
      })
    : null;

  // Global rank of current user
  const currentUserRank = currentUserData
    ? await prisma.user.count({
        where: { integrityScore: { gt: currentUserData.integrityScore } },
      }) + 1
    : null;

  function getVerifiedCount(user: typeof topBuilders[0]) {
    return user.roadmaps[0]?.tracks
      .flatMap((t) => t.phases.flatMap((p) => p.tasks))
      .filter((t) => t.status === "verified").length ?? 0;
  }

  function getStreakLabel(score: number) {
    if (score >= 200) return { label: "LEGEND", color: "var(--accent)" };
    if (score >= 100) return { label: "ELITE", color: "var(--purple)" };
    if (score >= 50)  return { label: "PROVEN", color: "var(--green)" };
    if (score >= 20)  return { label: "RISING", color: "var(--blue)" };
    return { label: "FORGING", color: "var(--text-dim)" };
  }

  const rankColors = ["var(--accent)", "#c0c0c0", "#cd7f32"];

  return (
    <div style={{ maxWidth: "760px" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
          <Trophy size={28} color="var(--accent)" strokeWidth={1.5} />
          <h1 style={{ fontFamily: "var(--font-headline)", fontSize: "2.5rem", letterSpacing: "0.05em" }}>
            Leaderboard
          </h1>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
          Ranked by integrity score — earned only by passing interrogations.
        </p>
      </div>

      {/* Current user rank card */}
      {currentUserData && currentUserRank && (
        <div className="forge-panel" style={{
          padding: "1.25rem 1.5rem", marginBottom: "1.5rem",
          borderColor: "var(--accent)", background: "rgba(245,158,11,0.04)",
          display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
        }}>
          <div style={{ fontFamily: "var(--font-headline)", fontSize: "1.5rem", color: "var(--accent)", minWidth: "56px" }}>
            #{currentUserRank}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "1rem" }}>
              You · {currentUserData.name}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-dim)", marginTop: "0.125rem" }}>
              {currentUserData.integrityScore} integrity pts
              {!currentUserData.isPublic && " · Profile hidden — go to Settings → make public to appear here"}
            </div>
          </div>
          {!currentUserData.isPublic && (
            <Link href="/dashboard/settings" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--blue)", textDecoration: "none" }}>
              Go public →
            </Link>
          )}
        </div>
      )}

      {/* Leaderboard table */}
      {topBuilders.length === 0 ? (
        <div className="forge-panel" style={{ padding: "3rem", textAlign: "center" }}>
          <div style={{ color: "var(--text-dim)", marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
            <Trophy size={40} strokeWidth={1.5} />
          </div>
          <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "1.5rem", marginBottom: "0.5rem" }}>No public profiles yet</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", marginBottom: "1.5rem" }}>
            Be the first. Go to Settings and make your profile public.
          </p>
          <Link href="/dashboard/settings" className="forge-btn forge-btn-primary">Make Profile Public</Link>
        </div>
      ) : (
        <div className="forge-panel" style={{ overflow: "hidden" }}>
          {topBuilders.map((builder, idx) => {
            const rank = idx + 1;
            const verified = getVerifiedCount(builder);
            const sessions = builder.roadmaps[0]?.checkins.length ?? 0;
            const { label, color } = getStreakLabel(builder.integrityScore);
            const isCurrentUser = builder.id === currentUserId;
            const rankColor = rank <= 3 ? rankColors[rank - 1] : "var(--text-dim)";

            return (
              <div
                key={builder.id}
                style={{
                  display: "flex", alignItems: "center", gap: "1rem",
                  padding: "1rem 1.5rem",
                  borderBottom: idx < topBuilders.length - 1 ? "1px solid var(--border)" : "none",
                  background: isCurrentUser ? "rgba(245,158,11,0.04)" : "transparent",
                  transition: "background 0.15s",
                }}
              >
                {/* Rank */}
                <div style={{
                  fontFamily: "var(--font-headline)", fontSize: rank <= 3 ? "1.375rem" : "1rem",
                  color: rankColor, minWidth: "40px", textAlign: "center",
                }}>
                  {rank <= 3 ? ["🥇","🥈","🥉"][rank - 1] : `#${rank}`}
                </div>

                {/* Avatar */}
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
                  background: `linear-gradient(135deg, ${color}30, ${color}10)`,
                  border: `1px solid ${color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-headline)", fontSize: "1rem", color,
                }}>
                  {(builder.name ?? "?")[0].toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.9375rem" }}>
                      {builder.name ?? "Anonymous"}
                      {isCurrentUser && <span style={{ color: "var(--accent)", marginLeft: "0.375rem", fontSize: "0.75rem" }}>(you)</span>}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "0.5625rem", letterSpacing: "0.12em",
                      padding: "0.125rem 0.5rem", borderRadius: "3px",
                      background: `${color}15`, color, border: `1px solid ${color}30`,
                      textTransform: "uppercase",
                    }}>
                      {label}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
                    {builder.roadmaps[0] && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "var(--text-dim)" }}>
                        {builder.roadmaps[0].title.slice(0, 32)}
                      </span>
                    )}
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "var(--green)" }}>
                      <CheckCircle2 size={10} /> {verified} verified
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "var(--text-dim)" }}>
                      <Zap size={10} /> {sessions} sessions
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", justifyContent: "flex-end" }}>
                    <Shield size={13} color={color} />
                    <span style={{ fontFamily: "var(--font-headline)", fontSize: "1.25rem", color }}>
                      {builder.integrityScore}
                    </span>
                  </div>
                  <Link
                    href={`/log/${builder.id}`}
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-dim)", textDecoration: "none", letterSpacing: "0.08em" }}
                  >
                    view log →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ color: "var(--text-dim)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", textAlign: "center", marginTop: "1.5rem" }}>
        Only users with public profiles appear here. · Settings → make profile public
      </p>
    </div>
  );
}
