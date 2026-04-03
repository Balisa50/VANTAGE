"use client";

import { useState } from "react";

export default function DigestSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === "loading") return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="relative border-t border-border">
        <div className="absolute inset-0 hero-glow pointer-events-none" />
        <div className="relative text-center py-10 px-4">
          <span className="inline-flex items-center gap-2 text-sm font-mono text-accent-amber">
            <span className="w-2 h-2 rounded-full bg-accent-green" />
            You&apos;re in.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative border-t border-border">
      <div className="absolute inset-0 hero-glow pointer-events-none" />
      <div className="relative text-center py-10 px-4">
        <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-accent-amber mb-1">
          Intelligence Brief
        </h3>
        <p className="text-sm text-text-secondary mb-5">
          The stories that matter. Delivered.
        </p>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-md mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full sm:flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary outline-none focus:border-accent-amber/40 focus:shadow-[0_0_12px_rgba(245,158,11,0.06)] transition-all min-w-0"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full sm:w-auto px-6 py-2.5 bg-accent-amber text-background text-sm font-mono font-medium rounded-lg hover:bg-accent-amber/90 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {status === "loading" ? "..." : "Subscribe"}
          </button>
        </form>
        {status === "error" && (
          <p className="text-xs text-accent-red mt-2 font-mono">
            Something went wrong. Try again.
          </p>
        )}
      </div>
    </div>
  );
}
