"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Clock, Zap, Search, CheckCircle2, XCircle, ChevronDown, ChevronUp, ExternalLink, BookOpen, CirclePlay, BookMarked, Target, HelpCircle, X, Loader2 } from "lucide-react";
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
  resources?: string[];
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

const TASK_STATUS: Record<string, { Icon: LucideIcon; color: string; label: string }> = {
  locked:               { Icon: Lock,         color: "var(--text-dim)",  label: "Locked" },
  available:            { Icon: Clock,        color: "var(--yellow)",    label: "Ready" },
  in_progress:          { Icon: Zap,          color: "var(--blue)",      label: "In Progress" },
  pending_verification: { Icon: Search,       color: "var(--orange)",    label: "Pending" },
  verified:             { Icon: CheckCircle2, color: "var(--green)",     label: "Verified" },
  failed:               { Icon: XCircle,      color: "var(--red)",       label: "Failed" },
};

/** Convert "YouTube: Channel — Topic" into a clickable YouTube search link */
function parseResource(resource: string): { type: "url" | "youtube" | "book" | "text"; label: string; href?: string } {
  // YouTube channel reference
  const ytMatch = resource.match(/^YouTube:\s*(.+?)(?:\s*[—–-]\s*(.+))?$/i);
  if (ytMatch) {
    const channel = ytMatch[1].trim();
    const topic = ytMatch[2]?.trim();
    const query = topic ? `${channel} ${topic}` : channel;
    return {
      type: "youtube",
      label: topic ? `${channel} — ${topic}` : channel,
      href: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    };
  }

  // Book reference
  if (resource.startsWith("Book:")) {
    return {
      type: "book",
      label: resource.replace(/^Book:\s*/, ""),
    };
  }

  // URL
  if (resource.startsWith("http://") || resource.startsWith("https://")) {
    try {
      const url = new URL(resource);
      const host = url.hostname.replace("www.", "");
      const path = url.pathname.length > 1 ? url.pathname.slice(0, 40) : "";
      return {
        type: "url",
        label: `${host}${path}${url.pathname.length > 40 ? "..." : ""}`,
        href: resource,
      };
    } catch {
      return { type: "url", label: resource.slice(0, 60), href: resource };
    }
  }

  return { type: "text", label: resource };
}

type TutorState = {
  taskId: string;
  question: string;
  hint: string | null;
  loading: boolean;
  open: boolean;
};

export default function RoadmapView({ roadmap }: { roadmap: Roadmap }) {
  const [activeTrack, setActiveTrack] = useState(roadmap.tracks[0]?.id ?? "");
  const [expandedPhase, setExpandedPhase] = useState<string | null>(roadmap.tracks[0]?.phases[0]?.id ?? null);
  const [tutor, setTutor] = useState<TutorState | null>(null);

  const track = roadmap.tracks.find((t) => t.id === activeTrack);

  const openTutor = (taskId: string) => {
    setTutor({ taskId, question: "", hint: null, loading: false, open: true });
  };

  const askTutor = async () => {
    if (!tutor) return;
    setTutor((t) => t && { ...t, loading: true, hint: null });
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: tutor.taskId, question: tutor.question }),
      });
      const data = await res.json();
      setTutor((t) => t && { ...t, loading: false, hint: data.hint ?? data.error ?? "Try again." });
    } catch {
      setTutor((t) => t && { ...t, loading: false, hint: "Network error — try again." });
    }
  };

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
                      {pct === 100 ? <CheckCircle2 size={16} /> : pi + 1}
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
                          const s = TASK_STATUS[task.status] ?? { Icon: Clock, color: "var(--text-dim)", label: "Unknown" };
                          const isVerified = task.status === "verified";
                          const isLocked = task.status === "locked";

                          return (
                            <div
                              key={task.id}
                              style={{
                                padding: "1.25rem 1.5rem",
                                borderBottom: ti < phase.tasks.length - 1 ? "1px solid var(--border)" : "none",
                                opacity: isLocked ? 0.4 : 1,
                                position: "relative",
                              }}
                            >
                              {/* Status circle — top right */}
                              <div
                                style={{
                                  position: "absolute",
                                  top: "1rem",
                                  right: "1.25rem",
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "50%",
                                  border: isVerified
                                    ? "2px solid var(--green)"
                                    : isLocked
                                      ? "2px solid var(--border)"
                                      : `2px solid ${s.color}`,
                                  background: isVerified ? "rgba(34,197,94,0.1)" : "transparent",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                title={s.label}
                              >
                                {isVerified ? (
                                  <CheckCircle2 size={16} color="var(--green)" strokeWidth={2.5} />
                                ) : isLocked ? (
                                  <Lock size={12} color="var(--text-dim)" />
                                ) : (
                                  <s.Icon size={14} color={s.color} strokeWidth={2} />
                                )}
                              </div>

                              <div style={{ paddingRight: "2.5rem" }}>
                                {/* Task title */}
                                <div style={{
                                  fontFamily: "var(--font-body)",
                                  fontWeight: 700,
                                  fontSize: "1rem",
                                  color: isVerified ? "var(--green)" : isLocked ? "var(--text-dim)" : "var(--text-primary)",
                                  textDecoration: isVerified ? "line-through" : "none",
                                  textDecorationColor: "rgba(34,197,94,0.3)",
                                  marginBottom: "0.375rem",
                                }}>
                                  {task.title}
                                </div>

                                {/* Detail */}
                                <p style={{
                                  color: "var(--text-secondary)",
                                  fontSize: "0.875rem",
                                  lineHeight: 1.6,
                                  marginBottom: task.why || task.milestone ? "0.5rem" : 0,
                                }}>
                                  {task.detail}
                                </p>

                                {/* Why */}
                                {task.why && (
                                  <div style={{
                                    fontSize: "0.8125rem",
                                    color: "var(--accent)",
                                    fontStyle: "italic",
                                    lineHeight: 1.5,
                                    marginBottom: "0.375rem",
                                    paddingLeft: "0.75rem",
                                    borderLeft: "2px solid var(--accent)",
                                  }}>
                                    {task.why}
                                  </div>
                                )}

                                {/* Milestone */}
                                {task.milestone && (
                                  <div style={{
                                    marginTop: "0.5rem",
                                    padding: "0.5rem 0.75rem",
                                    background: isVerified ? "rgba(34,197,94,0.06)" : "rgba(245,158,11,0.04)",
                                    border: isVerified ? "1px solid rgba(34,197,94,0.15)" : "1px solid rgba(245,158,11,0.1)",
                                    borderRadius: "6px",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "0.5rem",
                                  }}>
                                    <Target size={13} color={isVerified ? "var(--green)" : "var(--accent)"} strokeWidth={2} style={{ flexShrink: 0, marginTop: "0.1rem" }} />
                                    <span style={{
                                      fontFamily: "var(--font-mono)",
                                      fontSize: "0.75rem",
                                      color: isVerified ? "var(--green)" : "var(--text-secondary)",
                                    }}>
                                      {task.milestone}
                                    </span>
                                  </div>
                                )}

                                {/* Verified date */}
                                {task.verifiedAt && (
                                  <div style={{ marginTop: "0.375rem", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--green)" }}>
                                    Verified {new Date(task.verifiedAt).toLocaleDateString()}
                                  </div>
                                )}

                                {/* Action row — only for active tasks */}
                                {(task.status === "available" || task.status === "in_progress") && (
                                  <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                    {/* Check In Now */}
                                    <a
                                      href="/dashboard/checkin"
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.375rem",
                                        background: "var(--accent)",
                                        border: "none",
                                        borderRadius: "6px",
                                        padding: "0.375rem 0.875rem",
                                        cursor: "pointer",
                                        fontFamily: "var(--font-body)",
                                        fontWeight: 700,
                                        fontSize: "0.8125rem",
                                        color: "#000",
                                        textDecoration: "none",
                                        letterSpacing: "0.02em",
                                        transition: "all 0.15s",
                                      }}
                                      onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLAnchorElement).style.background = "#fbbf24";
                                        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 18px rgba(245,158,11,0.3)";
                                      }}
                                      onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLAnchorElement).style.background = "var(--accent)";
                                        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
                                      }}
                                    >
                                      <Zap size={12} />
                                      Check In Now
                                    </a>

                                    {/* Stuck? */}
                                    <button
                                      type="button"
                                      onClick={() => openTutor(task.id)}
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.375rem",
                                        background: "none",
                                        border: "1px solid var(--border)",
                                        borderRadius: "6px",
                                        padding: "0.3125rem 0.75rem",
                                        cursor: "pointer",
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.6875rem",
                                        color: "var(--text-dim)",
                                        letterSpacing: "0.05em",
                                        transition: "all 0.15s",
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "var(--accent)";
                                        e.currentTarget.style.color = "var(--accent)";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "var(--border)";
                                        e.currentTarget.style.color = "var(--text-dim)";
                                      }}
                                    >
                                      <HelpCircle size={11} />
                                      Stuck?
                                    </button>
                                  </div>
                                )}

                                {/* Estimated hours */}
                                {task.estimatedHours && !isLocked && (
                                  <div style={{
                                    marginTop: "0.5rem",
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "0.6875rem",
                                    color: "var(--text-dim)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                  }}>
                                    <Clock size={11} /> ~{task.estimatedHours}h estimated
                                  </div>
                                )}

                                {/* Resources */}
                                {!isLocked && task.resources && task.resources.length > 0 && (
                                  <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                                    <div style={{
                                      fontFamily: "var(--font-mono)",
                                      fontSize: "0.6875rem",
                                      color: "var(--text-dim)",
                                      letterSpacing: "0.1em",
                                      textTransform: "uppercase",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.375rem",
                                      marginBottom: "0.125rem",
                                    }}>
                                      <BookOpen size={11} /> Resources
                                    </div>
                                    {task.resources.map((resource, ri) => {
                                      const parsed = parseResource(resource);

                                      if (parsed.type === "youtube") {
                                        return (
                                          <a
                                            key={ri}
                                            href={parsed.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              gap: "0.375rem",
                                              fontSize: "0.8125rem",
                                              color: "#ff4444",
                                              textDecoration: "none",
                                              fontFamily: "var(--font-body)",
                                              transition: "opacity 0.15s",
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                                            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                                          >
                                            <CirclePlay size={14} />
                                            {parsed.label}
                                          </a>
                                        );
                                      }

                                      if (parsed.type === "url") {
                                        return (
                                          <a
                                            key={ri}
                                            href={parsed.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              gap: "0.375rem",
                                              fontSize: "0.8125rem",
                                              color: "var(--blue)",
                                              textDecoration: "none",
                                              fontFamily: "var(--font-body)",
                                              transition: "opacity 0.15s",
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                                            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                                          >
                                            <ExternalLink size={12} />
                                            {parsed.label}
                                          </a>
                                        );
                                      }

                                      if (parsed.type === "book") {
                                        return (
                                          <span
                                            key={ri}
                                            style={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              gap: "0.375rem",
                                              fontSize: "0.8125rem",
                                              color: "var(--text-secondary)",
                                              fontFamily: "var(--font-body)",
                                            }}
                                          >
                                            <BookMarked size={12} color="var(--accent)" />
                                            {parsed.label}
                                          </span>
                                        );
                                      }

                                      return (
                                        <span key={ri} style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                                          {parsed.label}
                                        </span>
                                      );
                                    })}
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

      {/* Tutor panel */}
      <AnimatePresence>
        {tutor?.open && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "fixed",
              bottom: "1.5rem",
              right: "1.5rem",
              width: "min(420px, calc(100vw - 2rem))",
              zIndex: 50,
            }}
          >
            <div
              className="forge-panel"
              style={{ padding: "1.25rem", boxShadow: "0 8px 32px rgba(0,0,0,0.45)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle size={16} color="var(--accent)" strokeWidth={2} />
                  <span style={{ fontFamily: "var(--font-headline)", fontSize: "1rem" }}>
                    Stuck?
                  </span>
                </div>
                <button
                  onClick={() => setTutor(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", padding: "0.25rem" }}
                >
                  <X size={16} />
                </button>
              </div>

              <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                Describe where you&apos;re stuck. The tutor will nudge you — not solve it for you.
              </p>

              <textarea
                value={tutor.question}
                onChange={(e) => setTutor((t) => t && { ...t, question: e.target.value })}
                placeholder="e.g. I don't understand why my useEffect runs twice..."
                className="forge-input"
                rows={3}
                style={{ resize: "none", marginBottom: "0.75rem", fontSize: "0.875rem" }}
                disabled={tutor.loading}
              />

              {tutor.hint && (
                <div
                  style={{
                    background: "rgba(245,158,11,0.06)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: "6px",
                    padding: "0.75rem",
                    fontSize: "0.875rem",
                    lineHeight: 1.6,
                    color: "var(--text-primary)",
                    marginBottom: "0.75rem",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {tutor.hint}
                </div>
              )}

              <button
                onClick={askTutor}
                disabled={tutor.loading}
                className="forge-btn forge-btn-primary"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}
              >
                {tutor.loading
                  ? <><Loader2 size={14} className="animate-spin" /> Thinking...</>
                  : tutor.hint ? "Ask again" : "Get a hint"
                }
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
