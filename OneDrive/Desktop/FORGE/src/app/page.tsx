"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Map, FlaskConical, Flame, Shield, BarChart3, Trophy, Users, ExternalLink, CheckCircle2 } from "lucide-react";

const FEATURES = [
  { Icon: Map,          title: "Roadmap From roadmap.sh",  desc: "Choose from 38 curated roadmap.sh paths — React, Python, DevOps, ML, and more. The AI generates missions for each phase based on the exact curriculum used by 1M+ developers." },
  { Icon: FlaskConical, title: "Daily AI Interrogation",   desc: "3 open-ended questions from THE PROFESSOR every time you check in. You explain what you built and why. Either you know it — or you don't. There's nowhere to hide." },
  { Icon: Flame,        title: "Verified Project Evidence", desc: "Submit your GitHub repo or live URL with every session. The system checks it's real, non-empty, and updated. No placeholder repos. No recycled links." },
  { Icon: Users,        title: "Accountability Pods",       desc: "Auto-matched with 4 people on similar paths. See who checked in today. Track each other's progress. No chat, no noise — just the shared weight of showing up." },
  { Icon: BarChart3,    title: "Public Build Log",          desc: "A verified, chronological record of every session you've completed. Shareable link, real project URLs, interrogation scores. Show employers what grinding actually looks like." },
  { Icon: Trophy,       title: "Verified Certificate",      desc: "Finish your roadmap and earn a cryptographically signed certificate with your pass rate and hours logged. Employers can verify it with a public link. It cannot be faked." },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Pick your path", desc: "Choose a roadmap.sh curriculum or describe your own goal. The AI builds a structured multi-phase roadmap with real resources." },
  { step: "02", title: "Commit to a schedule", desc: "Daily, weekdays, or custom. You decide. The Forge holds you to it." },
  { step: "03", title: "Check in with proof", desc: "Every committed day: submit a verified project URL and describe what you built. The system checks the URL is real." },
  { step: "04", title: "Face THE PROFESSOR", desc: "3 open-ended questions about your work. Pass at 40%. No MCQs, no guessing — you either understand what you built or you don't." },
  { step: "05", title: "Build your track record", desc: "Your public build log fills up. Your pod sees you showing up. Your certificate earns credibility session by session." },
];

const STATS = [
  { value: "38", label: "Curated Roadmaps" },
  { value: "3",  label: "Questions Per Session" },
  { value: "5",  label: "Grace Days / Month" },
  { value: "∞",  label: "Retry On Fail" },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <main style={{ background: "var(--bg-base)", color: "var(--text-primary)" }} className="min-h-screen">
      {/* NAV */}
      <nav style={{ borderBottom: "1px solid var(--border)", background: "rgba(6,6,8,0.9)", backdropFilter: "blur(10px)" }} className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
        <span style={{ fontFamily: "var(--font-headline)", color: "var(--accent)", fontSize: "1.375rem", fontWeight: 700 }}>The Forge</span>
        <div className="flex items-center gap-4">
          <Link href="/login" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.875rem" }} className="hover:text-white transition-colors">Sign In</Link>
          <Link href="/register" className="forge-btn forge-btn-primary">Start Free</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: "700px", height: "700px", background: "radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p style={{ fontFamily: "var(--font-mono)", color: "var(--accent)", fontSize: "0.6875rem", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "1.5rem" }}>
            For self-learners who are done lying to themselves
          </p>
          <h1 style={{ fontFamily: "var(--font-headline)", fontSize: "clamp(3.5rem, 11vw, 8rem)", lineHeight: 0.95, fontWeight: 700, marginBottom: "2rem" }}>
            The<br /><span style={{ color: "var(--accent)" }}>Forge</span>
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(1rem, 2.5vw, 1.25rem)", color: "var(--text-secondary)", maxWidth: "580px", margin: "0 auto 1.25rem", lineHeight: 1.7 }}>
            You set a goal. You commit to a schedule.<br />
            Every day you prove you worked — with a real project URL and 3 questions from an AI that has no mercy.
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(0.9375rem, 2vw, 1.0625rem)", color: "var(--text-primary)", maxWidth: "500px", margin: "0 auto 3rem", lineHeight: 1.6 }}>
            No tutorials counted. No half-finished repos. No excuses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register" className="forge-btn forge-btn-primary" style={{ padding: "0.875rem 2.5rem", fontSize: "1rem" }}>Start Forging — It&apos;s Free</Link>
            <Link href="/login" className="forge-btn forge-btn-ghost" style={{ padding: "0.875rem 2rem", fontSize: "1rem" }}>Sign In</Link>
          </div>
        </motion.div>
      </section>

      {/* STATS */}
      <section style={{ background: "var(--bg-panel)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }} className="py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div style={{ fontFamily: "var(--font-headline)", fontSize: "2.5rem", fontWeight: 700, color: "var(--accent)", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-secondary)", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: "0.25rem" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEM */}
      <section className="py-20 px-6 max-w-3xl mx-auto text-center">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "clamp(2rem, 6vw, 3.5rem)", fontWeight: 700, marginBottom: "1.5rem" }}>
            You watched the tutorial.<br />
            <span style={{ color: "var(--accent)" }}>You can&apos;t build it from scratch.</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.0625rem", lineHeight: 1.85 }}>
            Tutorial hell is real. You consume, you nod along, you close the tab and immediately forget.<br /><br />
            <span style={{ color: "var(--text-primary)" }}>The Forge breaks the cycle. Every day you submit a real project, answer questions about it, and prove — to yourself and to a public record — that you actually understood what you built.</span><br /><br />
            No self-reporting. No honor system. Verified by AI, tracked on a public timeline, held by a pod of peers who can see if you went quiet.
          </p>
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: "var(--bg-panel)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }} className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700, textAlign: "center", marginBottom: "3rem" }}>The Loop</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                style={{ display: "flex", gap: "1.5rem", padding: "1.5rem 0", borderBottom: i < HOW_IT_WORKS.length - 1 ? "1px solid var(--border)" : "none" }}
              >
                <div style={{ fontFamily: "var(--font-headline)", fontSize: "2.5rem", color: "rgba(245,158,11,0.2)", lineHeight: 1, flexShrink: 0, width: "56px" }}>
                  {step.step}
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-headline)", fontSize: "1.125rem", marginBottom: "0.375rem" }}>{step.title}</div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.65 }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700, textAlign: "center", marginBottom: "0.75rem" }}>Everything You Need to Finish</h2>
        <p style={{ color: "var(--text-secondary)", textAlign: "center", fontSize: "1rem", marginBottom: "3rem" }}>Built for serious self-learners. Not another habit tracker.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="forge-card p-6">
              <div style={{ color: "var(--accent)", marginBottom: "0.875rem" }}><f.Icon size={28} strokeWidth={1.5} /></div>
              <h3 style={{ fontFamily: "var(--font-headline)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>{f.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.65, fontFamily: "var(--font-body)" }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PROOF CONCEPT */}
      <section style={{ background: "var(--bg-panel)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }} className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "clamp(1.75rem, 5vw, 2.75rem)", fontWeight: 700, marginBottom: "1.25rem" }}>
              Your proof of work. Publicly verified.
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: 1.75, maxWidth: "560px", margin: "0 auto 2rem" }}>
              Every session you complete gets a permanent entry on your public build log — with the project URL, the interrogation score, and the date.
              Share it with employers. Show it to recruiters. Prove you didn&apos;t just watch videos.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              {[
                "GitHub repo verified ✓",
                "Interrogation score: 24/30",
                "Task: Build a REST API with auth",
                "Date: Apr 19, 2026",
              ].map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: "var(--font-mono)", fontSize: "0.75rem", letterSpacing: "0.05em",
                    padding: "0.375rem 0.875rem", borderRadius: "20px",
                    background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOR WHO */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "clamp(2rem, 5vw, 2.75rem)", fontWeight: 700, textAlign: "center", marginBottom: "2.5rem" }}>
          This is for you if...
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "You've started 10 courses and finished 0",
            "You want to show employers more than a GitHub with no commits",
            "You've tried accountability partners but they always go quiet",
            "You're in a bootcamp and want to actually retain what you learn",
            "You want a certificate that can't be faked",
            "You're serious enough to show up daily and prove it",
          ].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1rem 1.25rem", background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "10px" }}>
              <CheckCircle2 size={16} color="var(--green)" style={{ flexShrink: 0, marginTop: "2px" }} />
              <span style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "var(--bg-panel)", borderTop: "1px solid var(--border)" }} className="py-20 px-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
          <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "clamp(2.5rem, 8vw, 5rem)", fontWeight: 700, marginBottom: "1rem" }}>
            Stop consuming.<br /><span style={{ color: "var(--accent)" }}>Start proving.</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2.5rem", fontSize: "1.0625rem", maxWidth: "440px", margin: "0 auto 2.5rem" }}>
            Free forever. No credit card. Show up or don&apos;t — the record will be honest either way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register" className="forge-btn forge-btn-primary" style={{ padding: "1rem 3rem", fontSize: "1.125rem" }}>Forge Your Path →</Link>
            <a
              href="#"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontFamily: "var(--font-mono)", fontSize: "0.875rem", color: "var(--text-dim)", textDecoration: "none" }}
            >
              <ExternalLink size={13} /> See a sample build log
            </a>
          </div>
        </motion.div>
      </section>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "2rem 1.5rem", textAlign: "center", color: "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
        THE FORGE &copy; {new Date().getFullYear()}
      </footer>
    </main>
  );
}
