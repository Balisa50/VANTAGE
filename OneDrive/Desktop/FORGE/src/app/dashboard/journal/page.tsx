import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function JournalPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const checkins = await prisma.checkin.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      interrogation: true,
      task: { select: { title: true } },
      track: { select: { title: true, color: true } },
    },
  });

  return (
    <div>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", marginBottom: "0.5rem" }}>Journal</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>Every session, permanently recorded.</p>

      {checkins.length === 0 ? (
        <div className="forge-panel" style={{ padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📖</div>
          <p style={{ color: "var(--text-secondary)" }}>No sessions yet. Complete your first check-in to start your journal.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {checkins.map((c) => (
            <div key={c.id} className="forge-panel" style={{ padding: "1.5rem" }}>
              <div className="flex items-start justify-between gap-4 mb-3" style={{ flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.125rem", letterSpacing: "0.05em" }}>{c.task.title}</div>
                  <div className="flex items-center gap-2 mt-1" style={{ flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.6875rem", color: "var(--text-dim)" }}>{formatDate(c.createdAt)}</span>
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.6875rem", color: c.track.color }}>● {c.track.title}</span>
                  </div>
                </div>
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: c.status === "passed" ? "var(--green)" : c.status === "failed" ? "var(--red)" : "var(--yellow)",
                  background: c.status === "passed" ? "rgba(0,255,136,0.1)" : c.status === "failed" ? "rgba(255,45,45,0.1)" : "rgba(255,214,10,0.1)",
                  border: `1px solid ${c.status === "passed" ? "var(--green)" : c.status === "failed" ? "var(--red)" : "var(--yellow)"}`,
                  padding: "0.25rem 0.75rem",
                  borderRadius: "4px",
                  textTransform: "uppercase",
                }}>
                  {c.status}
                </div>
              </div>

              <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.6, marginBottom: c.interrogation ? "1rem" : 0 }}>
                {c.description}
              </p>

              {c.interrogation && (
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.875rem" }}>
                  <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
                    {[
                      { label: "M", value: c.interrogation.masteryScore },
                      { label: "Ap", value: c.interrogation.applicationScore },
                      { label: "An", value: c.interrogation.analysisScore },
                      { label: "R", value: c.interrogation.recallScore },
                      { label: "D", value: c.interrogation.depthScore },
                    ].map((s) => (
                      <span key={s.label} className="score-pill" style={{ color: s.value >= 7 ? "var(--green)" : s.value >= 5 ? "var(--yellow)" : "var(--red)" }}>
                        {s.label}:{s.value.toFixed(1)}
                      </span>
                    ))}
                    <span className="score-pill" style={{ color: "var(--blue)" }}>
                      Overall:{c.interrogation.overallScore.toFixed(1)}
                    </span>
                  </div>
                  {c.interrogation.feedback && (
                    <p style={{ color: "var(--text-dim)", fontSize: "0.8125rem", marginTop: "0.625rem", fontStyle: "italic" }}>
                      &ldquo;{c.interrogation.feedback}&rdquo;
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
