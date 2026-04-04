"use client";

import { useState } from "react";
import { getIntegrityBadge } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

const TIMEZONES = [
  "UTC", "Africa/Abidjan", "Africa/Accra", "Africa/Banjul", "Africa/Cairo",
  "Africa/Casablanca", "Africa/Dakar", "Africa/Johannesburg", "Africa/Lagos",
  "Africa/Nairobi", "Africa/Tunis", "America/New_York", "America/Chicago",
  "America/Denver", "America/Los_Angeles", "America/Toronto", "America/Sao_Paulo",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
  "Asia/Dubai", "Asia/Karachi", "Asia/Kolkata", "Asia/Dhaka", "Asia/Bangkok",
  "Asia/Singapore", "Asia/Tokyo", "Asia/Seoul", "Australia/Sydney", "Pacific/Auckland",
];

interface Props {
  user: { name: string; email: string; timezone: string; tier: string; integrityScore: number; createdAt: string };
  userId: string;
}

export default function SettingsForm({ user, userId }: Props) {
  const [name, setName] = useState(user.name);
  const [timezone, setTimezone] = useState(user.timezone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const badge = getIntegrityBadge(user.integrityScore);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, timezone }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const d = await res.json();
        setError(d.error ?? "Save failed.");
      }
    } catch {
      setError("Something went wrong.");
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Account info */}
      <div className="forge-panel" style={{ padding: "1.5rem" }}>
        <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "1.25rem", marginBottom: "1.25rem" }}>Account</h2>

        <div className="flex flex-col gap-3 mb-4" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
          {[
            { label: "Email", value: user.email },
            { label: "Tier", value: user.tier.toUpperCase() },
            { label: "Member Since", value: new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-center">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{item.label}</span>
              <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.9375rem" }}>{item.value}</span>
            </div>
          ))}
          <div className="flex justify-between items-center">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Integrity</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", color: badge.color, fontWeight: 700 }}>
              {user.integrityScore}/100 — {badge.label}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {error && (
            <div style={{ background: "rgba(255,45,45,0.1)", border: "1px solid var(--red)", borderRadius: "4px", padding: "0.625rem 1rem", color: "var(--red)", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}
          {saved && (
            <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid var(--green)", borderRadius: "6px", padding: "0.625rem 1rem", color: "var(--green)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={14} /> Settings saved.
            </div>
          )}

          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              Display Name
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="forge-input" required minLength={2} />
          </div>

          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              Timezone <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="forge-input" style={{ appearance: "none" }}>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
            <p style={{ color: "var(--text-dim)", fontSize: "0.75rem", marginTop: "0.375rem" }}>
              Changing timezone recalculates your daily deadlines.
            </p>
          </div>

          <button type="submit" className="forge-btn forge-btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="forge-panel" style={{ padding: "1.5rem", borderColor: "rgba(255,45,45,0.3)" }}>
        <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "1.25rem", marginBottom: "0.75rem", color: "var(--red)" }}>Danger Zone</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1rem" }}>
          These actions are permanent and cannot be undone.
        </p>
        <button
          onClick={() => {
            if (confirm("Delete your account? All data will be permanently removed.")) {
              fetch("/api/user/delete", { method: "DELETE" }).then(() => {
                window.location.href = "/";
              });
            }
          }}
          className="forge-btn"
          style={{ background: "transparent", border: "1px solid var(--red)", color: "var(--red)", fontSize: "0.8125rem" }}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
