"use client";

import { useState } from "react";
import Link from "next/link";
import LiveTimestamp from "./LiveTimestamp";
import BookmarkButton from "./BookmarkButton";
import type { Article } from "../lib/supabase";

const TIME_FILTERS = [
  { key: "6h", label: "6h", ms: 6 * 60 * 60 * 1000 },
  { key: "12h", label: "12h", ms: 12 * 60 * 60 * 1000 },
  { key: "24h", label: "24h", ms: 24 * 60 * 60 * 1000 },
] as const;

const REGION_LABELS: Record<string, string> = {
  global: "Global",
  africa: "Africa",
  asia: "Asia",
  europe: "Europe",
  americas: "Americas",
  middleeast: "Middle East",
};

function isHeatingUp(article: Article): boolean {
  const hours =
    (Date.now() - new Date(article.published_at).getTime()) / (1000 * 60 * 60);
  return hours < 6 && article.signal_score >= 65;
}

export default function TrendingBoard({
  initialArticles,
}: {
  initialArticles: Article[];
}) {
  const [timeFilter, setTimeFilter] = useState("24h");

  const cutoff =
    Date.now() -
    (TIME_FILTERS.find((f) => f.key === timeFilter)?.ms ?? 24 * 60 * 60 * 1000);

  const filtered = initialArticles.filter(
    (a) => new Date(a.published_at).getTime() >= cutoff
  );

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-red pulse-dot" />
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-accent-amber">
            Trending
          </span>
        </div>
        <h1 className="font-serif text-3xl md:text-4xl text-text-primary">
          Signal Board
        </h1>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {TIME_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setTimeFilter(f.key)}
            className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-all ${
              timeFilter === f.key
                ? "bg-accent-amber/10 text-accent-amber border-accent-amber/25"
                : "text-text-secondary border-border hover:border-accent-amber/15 hover:text-text-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 border border-border rounded-lg bg-surface">
          <p className="text-text-secondary font-serif text-lg italic">
            No stories in this window yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((article, i) => (
            <div key={article.id} className="relative group">
              <Link
                href={`/article/${article.slug}`}
                className="flex items-start gap-4 p-4 rounded-lg border border-border bg-surface hover:border-accent-amber/15 transition-all"
              >
                <div className="flex-shrink-0 w-8 text-center">
                  <span
                    className={`text-lg font-mono font-semibold ${
                      i < 3 ? "text-accent-amber" : "text-text-secondary/40"
                    }`}
                  >
                    {i + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {isHeatingUp(article) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
                        <span className="w-1 h-1 rounded-full bg-orange-400 pulse-dot" />
                        Heating up
                      </span>
                    )}
                    {article.category && (
                      <span className="text-[10px] font-mono tracking-wider uppercase text-accent-amber">
                        {article.category}
                      </span>
                    )}
                    {article.region && article.region !== "global" && (
                      <span className="text-[10px] font-mono text-text-secondary px-1.5 py-0.5 rounded bg-surface-elevated">
                        {REGION_LABELS[article.region] ?? article.region}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-base sm:text-lg text-text-primary group-hover:text-accent-amber transition-colors leading-snug">
                    {article.headline}
                  </h3>
                  <div className="mt-2">
                    <LiveTimestamp date={article.published_at} />
                  </div>
                </div>
              </Link>
              <div className="absolute top-4 right-4">
                <BookmarkButton article={article} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
