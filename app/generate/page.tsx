"use client";

import { useState } from "react";
import Masthead from "../components/Masthead";

export default function GeneratePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [secret, setSecret] = useState("");

  const generate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/generate-articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-secret": secret,
        },
      });

      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(
        `Error: ${err instanceof Error ? err.message : "Request failed"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Masthead />

      <main className="max-w-3xl mx-auto px-6 py-12">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-mono text-text-secondary hover:text-accent-amber transition-colors mb-8"
        >
          <span>&larr;</span> Back to all stories
        </a>

        <h2 className="font-serif text-2xl text-text-primary mb-2">
          Editorial Pipeline
        </h2>
        <p className="text-text-secondary text-sm mb-8">
          Fetch the latest tech headlines and generate analytical articles.
        </p>

        <div className="space-y-4">
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Enter CRON_SECRET..."
            className="w-full bg-surface border border-border rounded px-4 py-3 text-sm text-text-primary placeholder-text-secondary outline-none focus:border-accent-amber transition-colors"
          />

          <button
            onClick={generate}
            disabled={loading || !secret}
            className="w-full bg-accent-amber text-background font-mono text-sm py-3 rounded hover:bg-accent-amber/90 transition-colors disabled:opacity-40"
          >
            {loading ? (
              <span className="animate-pulse">
                Generating articles... this takes a minute
              </span>
            ) : (
              "Generate Latest Articles"
            )}
          </button>
        </div>

        {result && (
          <pre className="mt-8 bg-surface border border-border rounded p-4 text-xs font-mono text-text-secondary overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
            {result}
          </pre>
        )}
      </main>
    </div>
  );
}
