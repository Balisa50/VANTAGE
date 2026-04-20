"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, Ghost } from "lucide-react";

const TIMEZONES = [
  "UTC", "Africa/Abidjan", "Africa/Accra", "Africa/Addis_Ababa", "Africa/Algiers",
  "Africa/Banjul", "Africa/Cairo", "Africa/Casablanca", "Africa/Dakar",
  "Africa/Johannesburg", "Africa/Lagos", "Africa/Nairobi", "Africa/Tunis",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Toronto", "America/Sao_Paulo", "Europe/London", "Europe/Paris",
  "Europe/Berlin", "Europe/Moscow", "Asia/Dubai", "Asia/Karachi", "Asia/Kolkata",
  "Asia/Dhaka", "Asia/Bangkok", "Asia/Singapore", "Asia/Tokyo", "Asia/Seoul",
  "Australia/Sydney", "Pacific/Auckland",
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [timezone, setTimezone] = useState(
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const handleGuest = async () => {
    setGuestLoading(true);
    setError("");
    try {
      const res = await fetch("/api/guest", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create guest session");
      const { email: gEmail, password: gPass } = await res.json();
      const result = await signIn("credentials", { email: gEmail, password: gPass, redirect: false });
      if (result?.ok) {
        router.push("/onboarding");
        router.refresh();
      } else {
        setError("Could not start guest session. Try again.");
        setGuestLoading(false);
      }
    } catch {
      setError("Could not start guest session. Try again.");
      setGuestLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          timezone,
        }),
      });

      const data = await res.json().catch(() => ({ error: "Server returned invalid response" }));

      if (!res.ok) {
        setError(data.error ?? `Registration failed (${res.status}). Please try again.`);
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      const signInRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (signInRes?.error) {
        setError("Account created, but auto sign-in failed. Redirecting to login...");
        setTimeout(() => router.push("/login"), 1500);
        return;
      }
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Network error: ${msg}. Check your connection and retry.`);
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: "100%", maxWidth: "440px" }}
      >
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", color: "var(--text-secondary)", fontSize: "0.875rem", fontFamily: "var(--font-mono)", marginBottom: "1.25rem", textDecoration: "none" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="forge-panel" style={{ padding: "2.5rem" }}>
        <Link href="/" style={{ display: "block", textAlign: "center", marginBottom: "2rem" }}>
          <span style={{ fontFamily: "var(--font-headline)", color: "var(--red)", fontSize: "2rem", letterSpacing: "0.1em" }}>THE FORGE</span>
        </Link>

        <h1 style={{ fontFamily: "var(--font-headline)", fontSize: "1.75rem", textAlign: "center", marginBottom: "0.5rem" }}>Create Your Account</h1>
        <p style={{ color: "var(--text-secondary)", textAlign: "center", fontSize: "0.9375rem", marginBottom: "2rem" }}>Begin your accountability journey</p>

        {error && (
          <div style={{ background: "rgba(255,45,45,0.1)", border: "1px solid var(--red)", borderRadius: "4px", padding: "0.75rem 1rem", marginBottom: "1.5rem", color: "var(--red)", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="forge-input" placeholder="Abdoulie Balisa" required minLength={2} autoComplete="name" />
          </div>
          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="forge-input" placeholder="you@example.com" required autoComplete="email" />
          </div>
          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="forge-input" style={{ paddingRight: "2.75rem" }} placeholder="Min 6 characters" required minLength={6} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", padding: 0, display: "flex" }}>
                {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
              </button>
            </div>
          </div>
          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Timezone <span style={{ color: "var(--red)" }}>*</span></label>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="forge-input" style={{ appearance: "none" }}>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
            <p style={{ color: "var(--text-dim)", fontSize: "0.75rem", marginTop: "0.375rem" }}>Critical: affects your daily deadlines</p>
          </div>

          <button type="submit" className="forge-btn forge-btn-primary" style={{ width: "100%", marginTop: "0.5rem", padding: "0.75rem" }} disabled={loading}>
            {loading ? "Creating Account..." : "Forge My Path"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--blue)" }}>Sign In</Link>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.5rem 0" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-dim)", letterSpacing: "0.1em" }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>

        <button
          type="button"
          onClick={handleGuest}
          disabled={guestLoading}
          style={{
            width: "100%",
            padding: "0.75rem",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            cursor: guestLoading ? "not-allowed" : "pointer",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.8125rem",
            letterSpacing: "0.05em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            transition: "border-color 0.15s, color 0.15s",
            opacity: guestLoading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        >
          <Ghost size={15} strokeWidth={1.5} />
          {guestLoading ? "Starting demo..." : "Try as Guest"}
        </button>
        <p style={{ textAlign: "center", color: "var(--text-dim)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", marginTop: "0.5rem" }}>
          No signup. Progress erased when you leave.
        </p>
        </div>
      </motion.div>
    </div>
  );
}
