"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="forge-panel"
        style={{ width: "100%", maxWidth: "420px", padding: "2.5rem" }}
      >
        <Link href="/" style={{ display: "block", textAlign: "center", marginBottom: "2rem" }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", color: "var(--red)", fontSize: "2rem", letterSpacing: "0.1em" }}>THE FORGE</span>
        </Link>

        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.75rem", textAlign: "center", marginBottom: "0.5rem" }}>Welcome Back</h1>
        <p style={{ color: "var(--text-secondary)", textAlign: "center", fontSize: "0.9375rem", marginBottom: "2rem" }}>Sign in to your account</p>

        {error && (
          <div style={{ background: "rgba(255,45,45,0.1)", border: "1px solid var(--red)", borderRadius: "4px", padding: "0.75rem 1rem", marginBottom: "1.5rem", color: "var(--red)", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="forge-input"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="forge-input"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="forge-btn forge-btn-primary" style={{ width: "100%", marginTop: "0.5rem", padding: "0.75rem" }} disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
          No account?{" "}
          <Link href="/register" style={{ color: "var(--blue)" }}>Create one</Link>
        </div>
      </motion.div>
    </div>
  );
}
