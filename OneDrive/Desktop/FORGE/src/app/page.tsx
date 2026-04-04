"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const FEATURES = [
  { icon: "🗺️", title: "Define Your Path", desc: "Build a structured roadmap with phases, tasks, and milestones. AI-generates your curriculum in seconds." },
  { icon: "🔬", title: "Daily AI Interrogation", desc: "10-question MCQ interrogation by THE PROFESSOR every time you check in. No skipping. No faking." },
  { icon: "💣", title: "Real Consequences", desc: "3 failures in a month = PHASE WIPE. All your verified progress resets. Feel the pain. Learn faster." },
  { icon: "🛡️", title: "Integrity System", desc: "Every tab switch, copy-paste, and DevTools open is logged. Your certificate means something." },
  { icon: "📊", title: "5-Dimension Scoring", desc: "Mastery, Application, Analysis, Recall, Depth. Not just pass/fail — a complete cognitive fingerprint." },
  { icon: "🏆", title: "Verified Certificate", desc: "Employer-verifiable PDF certificate. Every score. Every check-in. Proof of real mastery." },
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
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", color: "var(--red)", fontSize: "1.5rem", letterSpacing: "0.1em" }}>THE FORGE</span>
        <div className="flex items-center gap-4">
          <Link href="/login" style={{ color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.875rem" }} className="hover:text-white transition-colors">Sign In</Link>
          <Link href="/register" className="forge-btn forge-btn-primary">Start Free</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(255,45,45,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p style={{ fontFamily: "'Share Tech Mono', monospace", color: "var(--red)", fontSize: "0.8125rem", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "1.5rem" }}>
            The Accountability Platform That Doesn&apos;t Play
          </p>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(4rem, 12vw, 9rem)", lineHeight: 0.9, letterSpacing: "0.02em", marginBottom: "2rem" }}>
            THE<br /><span style={{ color: "var(--red)" }}>FORGE</span>
          </h1>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "clamp(1.1rem, 3vw, 1.5rem)", color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto 3rem", lineHeight: 1.5 }}>
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
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", color: "var(--red)", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.6875rem", color: "var(--text-secondary)", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: "0.25rem" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEM */}
      <section className="py-20 px-6 max-w-3xl mx-auto text-center">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 6vw, 3.5rem)", marginBottom: "1.5rem" }}>You&apos;re Not Actually Learning</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.0625rem", lineHeight: 1.8 }}>
            You watch tutorials. You copy code. You read docs. You tell yourself you&apos;re learning.<br /><br />
            <span style={{ color: "var(--text-primary)" }}>But you can&apos;t explain what you built. You can&apos;t debug edge cases. You can&apos;t answer basic questions about your own work.</span><br /><br />
            THE FORGE fixes this by making you prove — every single day — that you actually learned what you claim you did.
          </p>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 5vw, 3rem)", textAlign: "center", marginBottom: "3rem" }}>How The Forge Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="forge-card p-6">
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{f.icon}</div>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.25rem", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>{f.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "var(--bg-panel)", borderTop: "1px solid var(--border)" }} className="py-20 px-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2.5rem, 8vw, 5rem)", marginBottom: "1rem" }}>Ready to be <span style={{ color: "var(--red)" }}>Forged?</span></h2>
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
