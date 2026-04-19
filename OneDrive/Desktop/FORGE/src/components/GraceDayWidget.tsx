"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Umbrella, Loader2 } from "lucide-react";

export default function GraceDayWidget({ graceDaysLeft }: { graceDaysLeft: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [used, setUsed] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);

  const handleUse = async () => {
    if (!confirm) { setConfirm(true); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/grace-days", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to use grace day."); setLoading(false); setConfirm(false); return; }
      setUsed(true);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
      setConfirm(false);
    }
  };

  const dots = Array.from({ length: 5 }, (_, i) => i < (5 - graceDaysLeft));

  if (used) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Umbrella size={14} color="var(--green)" />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--green)" }}>Grace day used — see you tomorrow.</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", flexWrap: "wrap" }}>
      {/* Dot meter */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
        <Umbrella size={13} color="var(--text-dim)" />
        <div style={{ display: "flex", gap: "3px" }}>
          {dots.map((used, i) => (
            <div key={i} style={{
              width: "10px", height: "10px", borderRadius: "50%",
              background: used ? "var(--border)" : "var(--blue)",
              opacity: used ? 0.35 : 1,
              transition: "background 0.2s",
            }} />
          ))}
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "var(--text-dim)", letterSpacing: "0.08em" }}>
          {graceDaysLeft}/5 left
        </span>
      </div>

      {/* Use button */}
      {graceDaysLeft > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={handleUse}
            disabled={loading}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.375rem",
              padding: "0.25rem 0.75rem",
              background: confirm ? "rgba(59,130,246,0.12)" : "transparent",
              border: confirm ? "1px solid var(--blue)" : "1px solid var(--border)",
              borderRadius: "5px",
              cursor: "pointer",
              fontFamily: "var(--font-mono)", fontSize: "0.6875rem",
              color: confirm ? "var(--blue)" : "var(--text-dim)",
              transition: "all 0.15s",
            }}
          >
            {loading
              ? <><Loader2 size={11} className="animate-spin" /> Using...</>
              : confirm
              ? "Confirm — use grace day"
              : "Use grace day"
            }
          </button>
          {confirm && (
            <button
              onClick={() => setConfirm(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: "0.6875rem" }}
            >
              cancel
            </button>
          )}
        </div>
      )}

      {error && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--red)" }}>{error}</span>}
    </div>
  );
}
