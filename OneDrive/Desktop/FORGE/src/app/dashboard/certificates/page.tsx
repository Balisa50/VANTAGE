import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireLearnerAccess } from "@/lib/role-guard";
import Link from "next/link";
import { Award, ExternalLink, Clock, CheckCircle2, Fingerprint, Target } from "lucide-react";
import CertShareButton from "@/components/CertShareButton";

export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  await requireLearnerAccess(userId);

  const certificates = await prisma.certificate.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6" style={{ flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-headline)", fontSize: "2.5rem", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
            Certificates
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
            Verifiable proof of your completed roadmaps.
          </p>
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="forge-panel" style={{ padding: "3rem", textAlign: "center", marginTop: "1rem" }}>
          <div style={{ color: "var(--accent)", marginBottom: "1rem" }}><Award size={48} strokeWidth={1.5} /></div>
          <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "1.75rem", marginBottom: "0.75rem" }}>No certificates yet</h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: "360px", margin: "0 auto 2rem" }}>
            Complete all tasks in a roadmap and pass the interrogations to earn a certificate.
          </p>
          <Link href="/dashboard/roadmap" className="forge-btn forge-btn-primary">View Roadmap</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {certificates.map((cert) => {
            const strongPassRate = cert.passRate >= 0.8;
            const issuedDate = new Date(cert.issuedAt).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
            });

            return (
              <div key={cert.id} className="forge-panel" style={{ padding: "1.5rem" }}>
                <div className="flex items-start justify-between gap-4" style={{ flexWrap: "wrap", marginBottom: "1.25rem" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--green)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.375rem" }}>
                      ✓ Verified
                    </div>
                    <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "1.375rem", letterSpacing: "0.03em", marginBottom: "0.25rem" }}>
                      {cert.title}
                    </h2>
                    <div className="flex items-center gap-1" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-dim)" }}>
                      <Clock size={11} /> {issuedDate}
                    </div>
                  </div>
                  <Link
                    href={`/verify/cert/${cert.verifyCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="forge-btn forge-btn-ghost"
                    style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", flexShrink: 0 }}
                  >
                    <ExternalLink size={14} /> Public Link
                  </Link>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  {[
                    { label: "Tasks", value: cert.totalTasks.toString(), color: "var(--text-primary)" },
                    { label: "Hours", value: cert.totalHours.toFixed(0), color: "var(--text-primary)" },
                    { label: "Pass Rate", value: `${Math.round(cert.passRate * 100)}%`, color: strongPassRate ? "var(--green)" : "var(--yellow)" },
                  ].map((stat) => (
                    <div key={stat.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "0.75rem", textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "var(--text-dim)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.25rem" }}>{stat.label}</div>
                      <div style={{ fontFamily: "var(--font-headline)", fontSize: "1.25rem", color: stat.color }}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3" style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                  <div className="flex items-center gap-1.5" style={{ fontSize: "0.8125rem" }}>
                    <Target size={13} color={strongPassRate ? "var(--green)" : "var(--yellow)"} strokeWidth={2} />
                    <span style={{ color: strongPassRate ? "var(--green)" : "var(--yellow)" }}>
                      {strongPassRate ? "Strong pass rate" : "Passed with retries"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5" style={{ fontSize: "0.8125rem" }}>
                    <CheckCircle2 size={13} color="var(--accent)" strokeWidth={2} />
                    <span style={{ color: "var(--text-secondary)" }}>Verified by AI interrogation</span>
                  </div>
                  <div className="flex items-center gap-1.5" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-dim)", marginLeft: "auto" }}>
                    <Fingerprint size={12} /> {cert.verifyCode.slice(0, 16)}…
                  </div>
                </div>

                {/* Share card */}
                <CertShareButton
                  certTitle={cert.title}
                  verifyCode={cert.verifyCode}
                  passRate={cert.passRate}
                  totalTasks={cert.totalTasks}
                  totalHours={cert.totalHours}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
