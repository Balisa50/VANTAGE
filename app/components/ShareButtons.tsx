"use client";

import { useState } from "react";

export default function ShareButtons({
  headline,
  slug,
}: {
  headline: string;
  slug: string;
}) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined"
    ? `${window.location.origin}/article/${slug}`
    : `/article/${slug}`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    headline
  )}&url=${encodeURIComponent(url)}&via=VantageIntel`;

  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    url
  )}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-text-secondary">Share</span>

      <button
        onClick={copyLink}
        className="text-xs font-mono text-text-secondary hover:text-accent-amber transition-colors px-2 py-1 rounded border border-border hover:border-accent-amber/30"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>

      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-mono text-text-secondary hover:text-accent-amber transition-colors px-2 py-1 rounded border border-border hover:border-accent-amber/30"
      >
        Twitter
      </a>

      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-mono text-text-secondary hover:text-accent-amber transition-colors px-2 py-1 rounded border border-border hover:border-accent-amber/30"
      >
        LinkedIn
      </a>
    </div>
  );
}
