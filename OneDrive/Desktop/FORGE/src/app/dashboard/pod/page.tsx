"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Zap, Clock, TrendingUp, LogOut, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

interface PodMember {
  userId: string;
  name: string;
  roadmapTitle: string | null;
  progress: number;
  lastCheckin: string | null;
  isMe: boolean;
}

interface Pod {
  id: string;
  name: string;
  category: string;
  maxSize: number;
  memberCount: number;
  members: PodMember[];
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never checked in";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Checked in <1h ago";
  if (hours < 24) return `Checked in ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Checked in yesterday";
  if (days < 7) return `Checked in ${days}d ago`;
  return `Checked in ${Math.floor(days / 7)}w ago`;
}

function getStatusColor(lastCheckin: string | null): string {
  if (!lastCheckin) return "var(--text-dim)";
  const hours = (Date.now() - new Date(lastCheckin).getTime()) / (1000 * 60 * 60);
  if (hours < 26) return "var(--green)";
  if (hours < 72) return "var(--yellow)";
  return "var(--red)";
}

export default function PodPage() {
  const [pod, setPod] = useState<Pod | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPod = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pods");
      const data = await res.json();
      setPod(data.pod);
    } catch {
      setError("Failed to load pod data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPod(); }, []);

  const handleJoin = async () => {
    setJoining(true);
    setError("");
    try {
      const res = await fetch("/api/pods", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to join a pod.");
      } else {
        setSuccess("Matched! Loading your pod...");
        await loadPod();
        setSuccess("");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm("Leave your pod? You can rejoin another one any time.")) return;
    setLeaving(true);
    try {
      await fetch("/api/pods/leave", { method: "POST" });
      setPod(null);
    } catch {
      setError("Failed to leave pod.");
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", gap: "0.75rem" }}>
        <Loader2 size={22} color="var(--text-dim)" className="animate-spin" />
        <span style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}>Loading pod...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-headline)", fontSize: "2.5rem", letterSpacing: "0.05em", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Users size={32} color="var(--accent)" strokeWidth={1.5} />
          Accountability Pod
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", maxWidth: "560px" }}>
          A small crew of people on similar journeys. You see each other&apos;s daily activity. No chat, no drama — just shared accountability.
        </p>
      </div>

      {error && (
        <div style={{ background: "rgba(255,45,45,0.08)", border: "1px solid var(--red)", borderRadius: "8px", padding: "0.875rem 1.25rem", marginBottom: "1.5rem", color: "var(--red)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {success && (
        <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid var(--green)", borderRadius: "8px", padding: "0.875rem 1.25rem", marginBottom: "1.5rem", color: "var(--green)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckCircle2 size={15} /> {success}
        </div>
      )}

      <AnimatePresence mode="wait">
        {!pod ? (
          <motion.div
            key="no-pod"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="forge-panel" style={{ padding: "3rem", textAlign: "center", maxWidth: "520px", margin: "0 auto" }}>
              <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "center" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(245,158,11,0.08)", border: "2px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={36} color="var(--accent)" strokeWidth={1.5} />
                </div>
              </div>
              <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "1.75rem", marginBottom: "0.75rem" }}>
                You&apos;re Alone Out Here
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.7, marginBottom: "2rem" }}>
                Join a pod and get matched with up to 4 people on a similar learning path.
                See who checked in today. Be the one who shows up.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
                {[
                  { icon: Zap, text: "Auto-matched by your roadmap category" },
                  { icon: Clock, text: "See when your pod members last checked in" },
                  { icon: TrendingUp, text: "Track each other's roadmap progress" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} style={{ display: "flex", alignItems: "center", gap: "0.75rem", textAlign: "left" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={15} color="var(--accent)" />
                    </div>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>{text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleJoin}
                disabled={joining}
                className="forge-btn forge-btn-primary"
                style={{ padding: "0.875rem 2.5rem", fontSize: "1rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                {joining ? <><Loader2 size={15} className="animate-spin" /> Matching...</> : "Find My Pod →"}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="in-pod"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {/* Pod header */}
            <div className="forge-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.25rem" }}>
                    {pod.category}
                  </div>
                  <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "1.5rem", marginBottom: "0.25rem" }}>{pod.name}</h2>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    {pod.memberCount} / {pod.maxSize} members
                  </div>
                </div>
                <button
                  onClick={handleLeave}
                  disabled={leaving}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.375rem",
                    fontFamily: "var(--font-mono)", fontSize: "0.75rem",
                    color: "var(--text-dim)", background: "none",
                    border: "1px solid var(--border)", borderRadius: "6px",
                    padding: "0.5rem 0.875rem", cursor: "pointer",
                    transition: "color 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.borderColor = "var(--red)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-dim)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  {leaving ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                  Leave Pod
                </button>
              </div>
            </div>

            {/* Members */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {pod.members.map((member, i) => {
                const statusColor = getStatusColor(member.lastCheckin);
                const checkedToday = member.lastCheckin
                  ? new Date(member.lastCheckin).toDateString() === new Date().toDateString()
                  : false;

                return (
                  <motion.div
                    key={member.userId}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="forge-panel"
                    style={{
                      padding: "1.25rem 1.5rem",
                      borderColor: member.isMe ? "var(--accent)" : "var(--border)",
                      background: member.isMe ? "rgba(245,158,11,0.04)" : "var(--bg-panel)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                      {/* Avatar */}
                      <div style={{
                        width: "42px", height: "42px", borderRadius: "50%",
                        background: `${statusColor}15`,
                        border: `2px solid ${statusColor}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--font-headline)", fontSize: "1.0625rem",
                        color: statusColor, flexShrink: 0,
                      }}>
                        {member.name[0]?.toUpperCase()}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.125rem", flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.9375rem" }}>{member.name}</span>
                          {member.isMe && (
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "3px", padding: "0.0625rem 0.375rem" }}>
                              YOU
                            </span>
                          )}
                          {checkedToday && (
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--green)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "3px", padding: "0.0625rem 0.375rem" }}>
                              ✓ TODAY
                            </span>
                          )}
                        </div>
                        {member.roadmapTitle && (
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-dim)", marginBottom: "0.125rem" }}>
                            {member.roadmapTitle}
                          </div>
                        )}
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: statusColor }}>
                          {timeAgo(member.lastCheckin)}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ minWidth: "120px", textAlign: "right" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-dim)", marginBottom: "0.25rem" }}>
                          {member.progress}% done
                        </div>
                        <div style={{ height: "4px", background: "var(--border)", borderRadius: "2px", width: "100%" }}>
                          <div style={{
                            height: "100%",
                            width: `${member.progress}%`,
                            background: member.progress >= 75 ? "var(--green)" : member.progress >= 40 ? "var(--accent)" : "var(--blue)",
                            borderRadius: "2px",
                            transition: "width 0.6s",
                          }} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Empty slots */}
              {Array.from({ length: pod.maxSize - pod.memberCount }, (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="forge-panel"
                  style={{
                    padding: "1.25rem 1.5rem",
                    borderStyle: "dashed", opacity: 0.4,
                    display: "flex", alignItems: "center", gap: "1rem",
                  }}
                >
                  <div style={{ width: "42px", height: "42px", borderRadius: "50%", border: "2px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Users size={16} color="var(--text-dim)" />
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)", letterSpacing: "0.1em" }}>
                    WAITING FOR MEMBER...
                  </span>
                </div>
              ))}
            </div>

            {/* Tip */}
            <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", background: "rgba(137,180,250,0.05)", border: "1px solid rgba(137,180,250,0.15)", borderRadius: "8px" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)", lineHeight: 1.6 }}>
                💡 Your pod members can see when you last checked in and your overall progress. No messages, no pressure — just the facts. Show up consistently and they&apos;ll know.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
