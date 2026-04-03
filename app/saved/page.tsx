"use client";

import Link from "next/link";
import Masthead from "../components/Masthead";
import { useBookmarks } from "../hooks/useBookmarks";

const REGION_LABELS: Record<string, string> = {
  global: "Global",
  africa: "Africa",
  asia: "Asia",
  europe: "Europe",
  americas: "Americas",
  middleeast: "Middle East",
};

export default function SavedPage() {
  const { bookmarks, remove, clear } = useBookmarks();

  return (
    <div className="min-h-screen">
      <Masthead />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-mono text-text-secondary hover:text-accent-amber transition-colors mb-8"
        >
          <span>&larr;</span> Back
        </a>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-serif text-3xl text-text-primary mb-1">
              Saved
            </h2>
            <p className="text-sm text-text-secondary font-mono">
              {bookmarks.length} {bookmarks.length === 1 ? "article" : "articles"} saved
            </p>
          </div>
          {bookmarks.length > 0 && (
            <button
              onClick={clear}
              className="text-xs font-mono text-text-secondary hover:text-accent-red transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {bookmarks.length === 0 ? (
          <div className="text-center py-20 border border-border rounded-lg bg-surface">
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 text-text-secondary/30 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
            <p className="text-text-secondary font-serif text-lg italic">
              No saved articles yet.
            </p>
            <p className="mt-2 text-text-secondary font-mono text-sm">
              Tap the bookmark icon on any article to save it here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((b) => (
              <div
                key={b.slug}
                className="flex items-start gap-4 p-4 rounded-lg border border-border bg-surface hover:border-accent-amber/15 transition-all group"
              >
                <Link href={`/article/${b.slug}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {b.category && (
                      <span className="text-[10px] font-mono tracking-wider uppercase text-accent-amber">
                        {b.category}
                      </span>
                    )}
                    {b.region && b.region !== "global" && (
                      <span className="text-[10px] font-mono text-text-secondary px-1.5 py-0.5 rounded bg-surface-elevated">
                        {REGION_LABELS[b.region] ?? b.region}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-lg text-text-primary group-hover:text-accent-amber transition-colors leading-snug">
                    {b.headline}
                  </h3>
                  {b.subheadline && (
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                      {b.subheadline}
                    </p>
                  )}
                </Link>
                <button
                  onClick={() => remove(b.slug)}
                  className="flex-shrink-0 p-2 text-text-secondary hover:text-accent-red transition-colors"
                  title="Remove"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
