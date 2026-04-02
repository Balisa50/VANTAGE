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
      <div className="text-center py-8 px-4 border-t border-b border-border my-8">
        <p className="font-mono text-sm text-accent-amber">
          You&apos;re on the list. We&apos;ll notify you when daily briefs go
          live.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-8 px-4 border-t border-b border-border my-8">
      <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-accent-amber mb-2">
        Stay in the loop
      </h3>
      <p className="text-sm text-text-secondary mb-4">
        Get notified when we launch daily intelligence briefs.
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-sm mx-auto"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="w-full sm:flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary outline-none focus:border-accent-amber/50 transition-colors min-w-0"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full sm:w-auto px-5 py-2.5 bg-accent-amber text-background text-sm font-mono rounded-lg hover:bg-accent-amber/90 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {status === "loading" ? "..." : "Notify Me"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-xs text-accent-red mt-2 font-mono">
          Something went wrong. Try again.
        </p>
      )}
    </div>
  );
}
