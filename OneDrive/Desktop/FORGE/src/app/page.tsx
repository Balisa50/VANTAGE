"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Map, FlaskConical, Flame, Shield, BarChart3, Trophy } from "lucide-react";

const FEATURES = [
  { Icon: Map,          title: "Define Your Path",       desc: "Build a structured roadmap with phases, tasks, and milestones. AI-generates your curriculum in seconds." },
  { Icon: FlaskConical, title: "Daily AI Interrogation",  desc: "10-question MCQ interrogation by THE PROFESSOR every time you check in. No skipping. No faking." },
  { Icon: Flame,        title: "Real Consequences",       desc: "3 failures in a month = PHASE WIPE. All your verified progress resets. Feel the pain. Learn faster." },
  { Icon: Shield,       title: "Integrity System",        desc: "Every tab switch, copy-paste, and DevTools open is logged. Your certificate means something." },
  { Icon: BarChart3,    title: "5-Dimension Scoring",     desc: "Mastery, Application, Analysis, Recall, Depth. Not just pass/fail — a complete cognitive fingerprint." },
  { Icon: Trophy,       title: "Verified Certificate",    desc: "Employer-verifiable PDF certificate. Every score. Every check-in. Proof of real mastery." },
];

const STATS = [
  { value: "251", label: "Days Max Journey" },
  { value: "10", label: "Questions Per Session" },
  { value: "100", label: "Starting Integrity" },
  { value: "7/10", label: "Pass Threshold" },
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
          <Link href="/login" style={{ color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.875rem" }} className="hover:text-white transition-colors">Sign In</Link>
          <Link href="/register" className="forge-btn forge-btn-primary">Start Free</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(255,45,45,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p style={{ fontFamily: "var(--font-mono)", color: "var(--accent)", fontSize: "0.75rem", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "1.5rem" }}>
            The Accountability Platform That Doesn&apos;t Play
          </p>
          <h1 style={{ fontFamily: "var(--font-headline)", fontSize: "clamp(3.5rem, 11vw, 8rem)", lineHeight: 0.95, fontWeight: 700, marginBottom: "2rem" }}>
            The<br /><span style={{ color: "var(--accent)" }}>Forge</span>
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(1rem, 2.5vw, 1.25rem)", color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto 3rem", lineHeight: 1.6 }}>
            The app that doesn&apos;t believe you until you prove it.<br />
            <span style={{ color: "var(--text-primary)" }}>Daily AI interrogations. Real consequences. Verified mastery.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register" className="forge-btn forge-btn-primary" style={{ padding: "0.875rem 2.5rem", fontSize: "1rem" }}>Forge Your Path — It&apos;s Free</Link>
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
          <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "clamp(2rem, 6vw, 3.5rem)", fontWeight: 700, marginBottom: "1.5rem" }}>You&apos;re Not Actually Learning</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.0625rem", lineHeight: 1.8 }}>
            You watch tutorials. You copy code. You read docs. You tell yourself you&apos;re learning.<br /><br />
            <span style={{ color: "var(--text-primary)" }}>But you can&apos;t explain what you built. You can&apos;t debug edge cases. You can&apos;t answer basic questions about your own work.</span><br /><br />
            THE FORGE fixes this by making you prove — every single day — that you actually learned what you claim you did.
          </p>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700, textAlign: "center", marginBottom: "3rem" }}>How The Forge Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="forge-card p-6">
              <div style={{ color: "var(--accent)", marginBottom: "0.875rem" }}><f.Icon size={28} strokeWidth={1.5} /></div>
              <h3 style={{ fontFamily: "var(--font-headline)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>{f.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.6, fontFamily: "var(--font-body)" }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "var(--bg-panel)", borderTop: "1px solid var(--border)" }} className="py-20 px-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
          <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "clamp(2.5rem, 8vw, 5rem)", fontWeight: 700, marginBottom: "1rem" }}>Ready to be <span style={{ color: "var(--accent)" }}>Forged?</span></h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2.5rem", fontSize: "1.0625rem" }}>Free to start. No credit card. Just accountability.</p>
          <Link href="/register" className="forge-btn forge-btn-primary" style={{ padding: "1rem 3rem", fontSize: "1.125rem" }}>Begin Your Journey</Link>
        </motion.div>
      </section>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "2rem 1.5rem", textAlign: "center", color: "var(--text-dim)", fontFamily: "'Share Tech Mono', monospace", fontSize: "0.75rem" }}>
        THE FORGE — Built by Abdoulie Balisa, The Gambia &copy; {new Date().getFullYear()}
      </footer>
    </main>
  );
}
