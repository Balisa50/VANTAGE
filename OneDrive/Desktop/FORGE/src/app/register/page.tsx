"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, timezone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      const signInRes = await signIn("credentials", { email, password, redirect: false });
      if (signInRes?.error) {
        setError("Account created but sign-in failed. Please sign in manually.");
        router.push("/login");
      } else {
        router.push("/onboarding");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="forge-panel"
        style={{ width: "100%", maxWidth: "440px", padding: "2.5rem" }}
      >
        <Link href="/" style={{ display: "block", textAlign: "center", marginBottom: "2rem" }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", color: "var(--red)", fontSize: "2rem", letterSpacing: "0.1em" }}>THE FORGE</span>
        </Link>

        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.75rem", textAlign: "center", marginBottom: "0.5rem" }}>Create Your Account</h1>
        <p style={{ color: "var(--text-secondary)", textAlign: "center", fontSize: "0.9375rem", marginBottom: "2rem" }}>Begin your accountability journey</p>

        {error && (
          <div style={{ background: "rgba(255,45,45,0.1)", border: "1px solid var(--red)", borderRadius: "4px", padding: "0.75rem 1rem", marginBottom: "1.5rem", color: "var(--red)", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="forge-input" placeholder="Abdoulie Balisa" required minLength={2} autoComplete="name" />
          </div>
          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="forge-input" placeholder="you@example.com" required autoComplete="email" />
          </div>
          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="forge-input" placeholder="Min 6 characters" required minLength={6} autoComplete="new-password" />
          </div>
          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Timezone <span style={{ color: "var(--red)" }}>*</span></label>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="forge-input" style={{ appearance: "none" }}>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
            <p style={{ color: "var(--text-dim)", fontSize: "0.75rem", marginTop: "0.375rem" }}>Critical — affects your daily deadlines</p>
          </div>

          <button type="submit" className="forge-btn forge-btn-primary" style={{ width: "100%", marginTop: "0.5rem", padding: "0.75rem" }} disabled={loading}>
            {loading ? "Creating Account..." : "Forge My Path"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--blue)" }}>Sign In</Link>
        </div>
      </motion.div>
    </div>
  );
}
