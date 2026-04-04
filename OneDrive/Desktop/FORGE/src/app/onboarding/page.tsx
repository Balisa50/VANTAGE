"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = ["intro", "roadmap", "consequences", "contract"] as const;
type Step = typeof STEPS[number];

const TEMPLATES = [
  { id: "fullstack", emoji: "💻", title: "Full-Stack Web Dev", desc: "HTML → CSS → JS → React → Node.js → PostgreSQL", weeks: 20 },
  { id: "datascience", emoji: "📊", title: "Data Science", desc: "Python → Pandas → ML → Deep Learning → Deployment", weeks: 24 },
  { id: "aiml", emoji: "🤖", title: "AI/ML Engineering", desc: "Python → PyTorch → LLMs → Fine-tuning → MLOps", weeks: 28 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [roadmapTitle, setRoadmapTitle] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const createRoadmap = async () => {
    if (!agreed) return;
    setLoading(true);
    try {
      const title = selectedTemplate
        ? TEMPLATES.find((t) => t.id === selectedTemplate)?.title ?? "My Learning Journey"
        : roadmapTitle || "My Learning Journey";

      const res = await fetch("/api/roadmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, templateId: selectedTemplate }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: "640px" }}>
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} style={{ width: "8px", height: "8px", borderRadius: "50%", background: STEPS.indexOf(step) >= i ? "var(--red)" : "var(--border)", transition: "background 0.3s" }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="text-center">
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔥</div>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "3rem", color: "var(--text-primary)", marginBottom: "1rem" }}>Welcome to The Forge</h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "1.0625rem", lineHeight: 1.8, marginBottom: "2.5rem", maxWidth: "480px", margin: "0 auto 2.5rem" }}>
                You&apos;re about to enter an accountability system that takes learning seriously.
                Every day, you&apos;ll prove what you learned. No exceptions.
              </p>
              <button onClick={() => setStep("roadmap")} className="forge-btn forge-btn-primary" style={{ padding: "0.875rem 2.5rem", fontSize: "1rem" }}>
                I&apos;m Ready
              </button>
            </motion.div>
          )}

          {step === "roadmap" && (
            <motion.div key="roadmap" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", marginBottom: "0.5rem" }}>Choose Your Path</h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.9375rem" }}>Select a template to start, or name your own journey.</p>

              <div className="flex flex-col gap-3 mb-6">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTemplate(t.id); setRoadmapTitle(""); }}
                    className="forge-card"
                    style={{ padding: "1rem 1.25rem", textAlign: "left", border: selectedTemplate === t.id ? "1px solid var(--blue)" : "1px solid var(--border)", cursor: "pointer", background: selectedTemplate === t.id ? "rgba(0,200,255,0.05)" : "var(--bg-card)", transition: "all 0.15s", width: "100%" }}
                  >
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: "1.5rem" }}>{t.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.125rem", letterSpacing: "0.05em" }}>{t.title}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", marginTop: "0.125rem" }}>{t.desc}</div>
                      </div>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.75rem", color: "var(--text-dim)" }}>{t.weeks}wk</div>
                    </div>
                  </button>
                ))}

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Or name your own:</p>
                  <input
                    type="text"
                    value={roadmapTitle}
                    onChange={(e) => { setRoadmapTitle(e.target.value); setSelectedTemplate(null); }}
                    className="forge-input"
                    placeholder="e.g. Learn Rust in 90 Days"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep("intro")} className="forge-btn forge-btn-ghost" style={{ flex: 1 }}>Back</button>
                <button
                  onClick={() => setStep("consequences")}
                  className="forge-btn forge-btn-primary"
                  style={{ flex: 2 }}
                  disabled={!selectedTemplate && !roadmapTitle.trim()}
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === "consequences" && (
            <motion.div key="consequences" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", marginBottom: "0.5rem", color: "var(--red)" }}>Read This Carefully</h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.9375rem" }}>These are the consequences of failing. They are real and cannot be disabled.</p>

              <div className="flex flex-col gap-3 mb-6">
                {[
                  { icon: "⏰", title: "Daily Check-in Required", desc: "Every day you must submit proof of work + pass an AI interrogation." },
                  { icon: "🔥", title: "Streak Breaks = Zero", desc: "Miss a day without a grace day and your streak resets to 0." },
                  { icon: "💀", title: "3 Failures = Phase Wipe", desc: "3 failures in one month resets ALL verified tasks in your current phase." },
                  { icon: "😳", title: "Shame Post System", desc: "Break your streak and you must post publicly about it. Skip = -5 integrity." },
                  { icon: "📉", title: "Integrity Score", desc: "Starts at 100. Tab switching, copy-pasting, and cheating reduce it permanently." },
                  { icon: "🤖", title: "AI Interrogation", desc: "10 MCQ questions, 5 min each. Cannot skip. Minimum 7/10 to pass." },
                ].map((item) => (
                  <div key={item.title} className="forge-card" style={{ padding: "0.875rem 1.125rem", display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "1.25rem", flexShrink: 0, marginTop: "0.125rem" }}>{item.icon}</span>
                    <div>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.25rem" }}>{item.title}</div>
                      <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep("roadmap")} className="forge-btn forge-btn-ghost" style={{ flex: 1 }}>Back</button>
                <button onClick={() => setStep("contract")} className="forge-btn forge-btn-primary" style={{ flex: 2 }}>I Understand</button>
              </div>
            </motion.div>
          )}

          {step === "contract" && (
            <motion.div key="contract" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="text-center">
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚔️</div>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", marginBottom: "1rem" }}>The Contract</h2>
              <div className="forge-panel" style={{ padding: "1.5rem", textAlign: "left", marginBottom: "2rem" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.8 }}>
                  I commit to showing up every day. I will complete my check-ins honestly.
                  I will face the consequences when I fail. I will not cheat, skip, or make excuses.
                  I am here to be forged — not coddled.
                </p>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "center", cursor: "pointer", marginBottom: "2rem" }}>
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: "18px", height: "18px", accentColor: "var(--red)", cursor: "pointer" }} />
                <span style={{ color: "var(--text-primary)", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>I commit to this journey</span>
              </label>

              <div className="flex gap-3">
                <button onClick={() => setStep("consequences")} className="forge-btn forge-btn-ghost" style={{ flex: 1 }}>Back</button>
                <button onClick={createRoadmap} className="forge-btn forge-btn-primary" style={{ flex: 2 }} disabled={!agreed || loading}>
                  {loading ? "Forging..." : "FORGE MY PATH"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
