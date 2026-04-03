"use client";

import { useLocalStorage } from "./useLocalStorage";

interface ReadEntry {
  slug: string;
  category: string | null;
  region: string | null;
  readAt: string;
}

export function useReadHistory() {
  const [history, setHistory] = useLocalStorage<ReadEntry[]>(
    "vantage-reads",
    []
  );

  function trackRead(article: {
    slug: string;
    category: string | null;
    region: string | null;
  }) {
    setHistory((prev) => {
      // Don't duplicate
      if (prev.some((h) => h.slug === article.slug)) return prev;
      const next = [
        { ...article, readAt: new Date().toISOString() },
        ...prev,
      ];
      // Keep last 100 reads
      return next.slice(0, 100);
    });
  }

  function getTopCategories(): string[] {
    const counts: Record<string, number> = {};
    for (const entry of history) {
      if (entry.category) {
        counts[entry.category] = (counts[entry.category] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);
  }

  function getTopRegions(): string[] {
    const counts: Record<string, number> = {};
    for (const entry of history) {
      if (entry.region) {
        counts[entry.region] = (counts[entry.region] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([reg]) => reg);
  }

  return { history, trackRead, getTopCategories, getTopRegions };
}
