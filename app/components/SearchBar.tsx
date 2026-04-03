"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { Article } from "../lib/supabase";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Article[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(value.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.articles);
          setOpen(true);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  async function handleGenerate() {
    if (generating || query.trim().length < 3) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/search-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.article) {
          setResults([data.article]);
        }
      }
    } catch {
      // Silent
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm" style={{ zIndex: 100 }}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search stories..."
          className="w-full bg-surface border border-border rounded-lg px-4 py-2 pl-9 text-sm text-text-primary placeholder-text-secondary outline-none focus:border-accent-amber/30 focus:shadow-[0_0_12px_rgba(245,158,11,0.04)] transition-all"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {(loading || generating) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border border-accent-amber border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-surface-elevated border border-border rounded-lg shadow-2xl max-h-80 overflow-y-auto" style={{ zIndex: 200 }}>
          {results.map((article) => (
            <Link
              key={article.id}
              href={`/article/${article.slug}`}
              onClick={() => {
                setOpen(false);
                setQuery("");
              }}
              className="block px-4 py-3 hover:bg-surface transition-colors border-b border-border/50 last:border-b-0"
            >
              <div className="flex items-center gap-2 mb-1">
                {article.category && (
                  <span className="text-[10px] font-mono tracking-wider uppercase text-accent-amber">
                    {article.category}
                  </span>
                )}
                {article.region && article.region !== "global" && (
                  <span className="text-[10px] font-mono text-text-secondary">
                    {article.region}
                  </span>
                )}
              </div>
              <p className="text-sm text-text-primary font-serif leading-snug">
                {article.headline}
              </p>
            </Link>
          ))}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full mt-2 w-full bg-surface-elevated border border-border rounded-lg shadow-2xl p-4" style={{ zIndex: 200 }}>
          {generating ? (
            <div className="text-center">
              <div className="w-4 h-4 border-2 border-accent-amber border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-accent-amber font-mono">
                Generating analysis...
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Building a deep-dive on this topic
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-text-secondary mb-3">
                No stories found for &ldquo;{query}&rdquo;
              </p>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-accent-amber/10 text-accent-amber text-xs font-mono rounded-lg border border-accent-amber/20 hover:bg-accent-amber/20 transition-all"
              >
                Generate analysis now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
