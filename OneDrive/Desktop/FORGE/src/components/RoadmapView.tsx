"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Clock, Zap, Search, CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Task {
  id: string;
  title: string;
  detail: string;
  why?: string | null;
  milestone?: string | null;
  status: string;
  estimatedHours?: number | null;
  verifiedAt?: Date | string | null;
}

interface Phase {
  id: string;
  title: string;
  tasks: Task[];
}

interface Track {
  id: string;
  title: string;
  color: string;
  phases: Phase[];
}

interface Roadmap {
  id: string;
  title: string;
  tracks: Track[];
}

const TASK_STATUS: Record<string, { Icon: LucideIcon; color: string }> = {
  locked:               { Icon: Lock,         color: "var(--text-dim)"  },
  available:            { Icon: Clock,        color: "var(--yellow)"    },
  in_progress:          { Icon: Zap,          color: "var(--blue)"      },
  pending_verification: { Icon: Search,       color: "var(--orange)"    },
  verified:             { Icon: CheckCircle2, color: "var(--green)"     },
  failed:               { Icon: XCircle,      color: "var(--red)"       },
};

export default function RoadmapView({ roadmap }: { roadmap: Roadmap }) {
  const [activeTrack, setActiveTrack] = useState(roadmap.tracks[0]?.id ?? "");
  const [expandedPhase, setExpandedPhase] = useState<string | null>(roadmap.tracks[0]?.phases[0]?.id ?? null);

  const track = roadmap.tracks.find((t) => t.id === activeTrack);

  return (
    <div>
      {/* Track tabs */}
      {roadmap.tracks.length > 1 && (
        <div className="flex gap-2 mb-6" style={{ flexWrap: "wrap" }}>
          {roadmap.tracks.map((t) => {
            const total = t.phases.reduce((s, p) => s + p.tasks.length, 0);
            const done = t.phases.reduce((s, p) => s + p.tasks.filter((tk) => tk.status === "verified").length, 0);
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTrack(t.id)}
                style={{
                  padding: "0.5rem 1.25rem",
                  borderRadius: "6px",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  border: activeTrack === t.id ? `1px solid ${t.color}` : "1px solid var(--border)",
                  background: activeTrack === t.id ? `${t.color}15` : "transparent",
                  color: activeTrack === t.id ? t.color : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {t.title}
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", opacity: 0.7 }}>
                  {pct}%
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Phases */}
      {track ? (
        <div className="flex flex-col gap-4">
          {track.phases.map((phase, pi) => {
            const total = phase.tasks.length;
            const done = phase.tasks.filter((t) => t.status === "verified").length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const isExpanded = expandedPhase === phase.id;

            return (
              <div key={phase.id} className="forge-panel">
                {/* Phase header */}
                <button
                  onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                  style={{
                    width: "100%",
                    padding: "1.25rem 1.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                    gap: "1rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: pct === 100 ? "var(--green)" : "var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: pct === 100 ? "#000" : "var(--text-dim)",
                      flexShrink: 0,
                    }}>
                      {pi + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-headline)", fontSize: "1rem", fontWeight: 600, textAlign: "left" }}>{phase.title}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-dim)", marginTop: "0.25rem" }}>
                        {done}/{total} tasks
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
                    <div style={{ width: "80px", height: "3px", background: "var(--border)", borderRadius: "2px" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: track.color, borderRadius: "2px" }} />
                    </div>
                    {isExpanded
                      ? <ChevronUp size={16} color="var(--text-dim)" />
                      : <ChevronDown size={16} color="var(--text-dim)" />
                    }
                  </div>
                </button>

                {/* Tasks */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ borderTop: "1px solid var(--border)" }}>
                        {phase.tasks.map((task, ti) => {
                          const s = TASK_STATUS[task.status] ?? { Icon: Clock, color: "var(--text-dim)" };
                          return (
                            <div
                              key={task.id}
                              style={{
                                padding: "1rem 1.5rem",
                                borderBottom: ti < phase.tasks.length - 1 ? "1px solid var(--border)" : "none",
                                opacity: task.status === "locked" ? 0.45 : 1,
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <s.Icon size={16} color={s.color} strokeWidth={2} style={{ flexShrink: 0, marginTop: "0.15rem" }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.9375rem", color: s.color }}>{task.title}</div>
                                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem", lineHeight: 1.5 }}>{task.detail}</p>
                                  {task.milestone && (
                                    <div style={{ marginTop: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                      <CheckCircle2 size={11} color="var(--green)" /> {task.milestone}
                                    </div>
                                  )}
                                  {task.verifiedAt && (
                                    <div style={{ marginTop: "0.25rem", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--green)" }}>
                                      Verified {new Date(task.verifiedAt).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                                {task.estimatedHours && (
                                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-dim)", flexShrink: 0 }}>
                                    ~{task.estimatedHours}h
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ color: "var(--text-secondary)" }}>No tracks found.</p>
      )}
    </div>
  );
}
