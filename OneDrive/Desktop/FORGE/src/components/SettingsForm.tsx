"use client";

import { useState } from "react";
import { getIntegrityBadge } from "@/lib/utils";
import { CheckCircle2, Copy, Check, Eye, EyeOff } from "lucide-react";

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
  user: {
    id: string;
    name: string;
    email: string;
    timezone: string;
    integrityScore: number;
    bio: string | null;
    github: string | null;
    linkedin: string | null;
    isPublic: boolean;
    learningStyle?: string;
    createdAt: string;
  };
  userId: string;
  role: string;
  isAlsoLearning: boolean;
}

const LEARNING_STYLES: Array<{ value: string; label: string; hint: string }> = [
  { value: "balanced",     label: "Balanced",     hint: "Mix of theory and hands-on building." },
  { value: "hands_on",     label: "Hands-on",     hint: "Minimize reading. Every task ships something." },
  { value: "theory_first", label: "Theory First", hint: "Front-load mental models, then apply them." },
  { value: "spaced",       label: "Spaced",       hint: "Short daily doses with review checkpoints." },
  { value: "sprint",       label: "Sprint",       hint: "Fewer, deeper sessions with bigger scope." },
];

export default function SettingsForm({ user, role, isAlsoLearning }: Props) {
  const [name, setName] = useState(user.name);
  const [timezone, setTimezone] = useState(user.timezone);
  const [bio, setBio] = useState(user.bio ?? "");
  const [github, setGithub] = useState(user.github ?? "");
  const [linkedin, setLinkedin] = useState(user.linkedin ?? "");
  const [isPublic, setIsPublic] = useState(user.isPublic);
  const [learningStyle, setLearningStyle] = useState(user.learningStyle ?? "balanced");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [copiedProfile, setCopiedProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  const badge = getIntegrityBadge(user.integrityScore);
  const isLearner = role === "learner" || role === "student" || (role === "mentor" && isAlsoLearning);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, timezone, bio, github, linkedin, isPublic, learningStyle }),
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    setPwSaving(true);
    setPwError("");
    setPwSaved(false);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setPwSaved(true);
        setCurrentPassword("");
        setNewPassword("");
        setTimeout(() => setPwSaved(false), 3000);
      } else {
        const d = await res.json();
        setPwError(d.error ?? "Password change failed.");
      }
    } catch {
      setPwError("Something went wrong.");
    }
    setPwSaving(false);
  };

  const copyProfileLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/log/${user.id}`);
    setCopiedProfile(true);
    setTimeout(() => setCopiedProfile(false), 2000);
  };

  const ROLE_LABELS: Record<string, string> = {
    learner:  "Solo Learner",
    student:  "Student",
    mentor:   "Mentor",
    bootcamp: "Bootcamp Admin",
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Account info */}
      <div className="forge-panel" style={{ padding: "1.5rem" }}>
        <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "1.25rem", marginBottom: "1.25rem" }}>Account</h2>

        <div className="flex flex-col gap-3 mb-4" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
          {[
            { label: "Email", value: user.email },
            { label: "Role", value: ROLE_LABELS[role] ?? role },
            { label: "Member Since", value: new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-center">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{item.label}</span>
              <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.9375rem" }}>{item.value}</span>
            </div>
          ))}

          {isLearner && (
            <div className="flex justify-between items-center">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Integrity</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", color: badge.color, fontWeight: 700 }}>
                +{user.integrityScore} · {badge.label}
              </span>
            </div>
          )}

          {role === "mentor" && isAlsoLearning && (
            <div className="flex justify-between items-center">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Mode</span>
              <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.9375rem", color: "var(--green)" }}>Mentoring + Learning</span>
            </div>
          )}
          {role === "mentor" && !isAlsoLearning && (
            <div className="flex justify-between items-center">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Mode</span>
              <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.9375rem", color: "var(--blue)" }}>Mentoring Only</span>
            </div>
          )}
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
            <label className="label-mono" style={{ display: "block", marginBottom: "0.5rem" }}>Display Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="forge-input" required minLength={2} />
          </div>

          <div>
            <label className="label-mono" style={{ display: "block", marginBottom: "0.5rem" }}>Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="forge-input" rows={3}
              placeholder={role === "mentor" ? "Share your mentoring expertise..." : role === "bootcamp" ? "Describe your organization..." : "Tell the world what you're building..."}
              style={{ resize: "vertical" }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-mono" style={{ display: "block", marginBottom: "0.5rem" }}>GitHub URL</label>
              <input type="url" value={github} onChange={(e) => setGithub(e.target.value)} className="forge-input" placeholder="https://github.com/username" />
            </div>
            <div>
              <label className="label-mono" style={{ display: "block", marginBottom: "0.5rem" }}>LinkedIn URL</label>
              <input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="forge-input" placeholder="https://linkedin.com/in/username" />
            </div>
          </div>

          <div>
            <label className="label-mono" style={{ display: "block", marginBottom: "0.5rem" }}>
              Timezone {isLearner && <span style={{ color: "var(--red)" }}>*</span>}
            </label>
            {isLearner && (
              <p style={{ color: "var(--text-dim)", fontSize: "0.75rem", marginBottom: "0.5rem" }}>This affects your daily check-in deadlines</p>
            )}
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="forge-input" style={{ appearance: "none" }}>
              {TIMEZONES.map((tz) => (<option key={tz} value={tz}>{tz}</option>))}
            </select>
          </div>

          {role !== "bootcamp" && (
            <div style={{ background: "var(--bg-card)", borderRadius: "8px", padding: "1rem", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.9375rem", marginBottom: "0.125rem" }}>Public Profile</div>
                  <div style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>
                    {role === "mentor" ? "Let students find your profile" : "Make your profile shareable with a public link"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  style={{ width: "44px", height: "24px", borderRadius: "12px", background: isPublic ? "var(--accent)" : "var(--border)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}
                >
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#fff", position: "absolute", top: "3px", left: isPublic ? "23px" : "3px", transition: "left 0.2s" }} />
                </button>
              </div>
              {isPublic && (
                <div style={{ marginTop: "0.75rem" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-dim)", marginBottom: "0.375rem", letterSpacing: "0.05em" }}>
                    Your public build log:
                  </div>
                  <div className="flex items-center gap-2">
                    <div style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--blue)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      /log/{user.id}
                    </div>
                    <button type="button" onClick={copyProfileLink} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", padding: "0.25rem" }}>
                      {copiedProfile ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isLearner && (
            <div>
              <label className="label-mono" style={{ display: "block", marginBottom: "0.5rem" }}>Learning Style</label>
              <p style={{ color: "var(--text-dim)", fontSize: "0.75rem", marginBottom: "0.75rem" }}>
                Affects how your roadmap tasks are scoped and sequenced.
              </p>
              <div className="flex flex-col gap-2">
                {LEARNING_STYLES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setLearningStyle(s.value)}
                    style={{
                      padding: "0.75rem 1rem", borderRadius: "8px",
                      border: learningStyle === s.value ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: learningStyle === s.value ? "rgba(245,158,11,0.06)" : "var(--bg-card)",
                      cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                      display: "flex", alignItems: "center", gap: "0.75rem",
                    }}
                  >
                    <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: learningStyle === s.value ? "5px solid var(--accent)" : "2px solid var(--border)", flexShrink: 0, transition: "all 0.15s" }} />
                    <div>
                      <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.9375rem", color: learningStyle === s.value ? "var(--accent)" : "var(--text-primary)" }}>{s.label}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-dim)", marginTop: "0.125rem" }}>{s.hint}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button type="submit" className="forge-btn forge-btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="forge-panel" style={{ padding: "1.5rem" }}>
        <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "1.25rem", marginBottom: "0.5rem" }}>Change Password</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
          Leave blank if you signed up with Google.
        </p>
        <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
          {pwError && (
            <div style={{ background: "rgba(255,45,45,0.1)", border: "1px solid var(--red)", borderRadius: "4px", padding: "0.625rem 1rem", color: "var(--red)", fontSize: "0.875rem" }}>
              {pwError}
            </div>
          )}
          {pwSaved && (
            <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid var(--green)", borderRadius: "6px", padding: "0.625rem 1rem", color: "var(--green)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={14} /> Password updated.
            </div>
          )}
          <div>
            <label className="label-mono" style={{ display: "block", marginBottom: "0.5rem" }}>Current Password</label>
            <div style={{ position: "relative" }}>
              <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="forge-input" style={{ paddingRight: "2.75rem" }} placeholder="••••••••" required />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", padding: 0, display: "flex" }}>
                {showCurrent ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label-mono" style={{ display: "block", marginBottom: "0.5rem" }}>New Password</label>
            <div style={{ position: "relative" }}>
              <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="forge-input" style={{ paddingRight: "2.75rem" }} placeholder="Min 6 characters" required minLength={6} />
              <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", padding: 0, display: "flex" }}>
                {showNew ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
              </button>
            </div>
          </div>
          <button type="submit" className="forge-btn forge-btn-ghost" disabled={pwSaving}>
            {pwSaving ? "Updating..." : "Update Password"}
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
