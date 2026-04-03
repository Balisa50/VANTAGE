"use client";

import { useLocalStorage } from "./useLocalStorage";

export interface BookmarkedArticle {
  slug: string;
  headline: string;
  subheadline: string | null;
  category: string | null;
  region: string | null;
  signal_score: number;
  published_at: string;
  savedAt: string;
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useLocalStorage<BookmarkedArticle[]>(
    "vantage-bookmarks",
    []
  );

  function isBookmarked(slug: string): boolean {
    return bookmarks.some((b) => b.slug === slug);
  }

  function toggle(article: {
    slug: string;
    headline: string;
    subheadline: string | null;
    category: string | null;
    region: string | null;
    signal_score: number;
    published_at: string;
  }) {
    setBookmarks((prev) => {
      if (prev.some((b) => b.slug === article.slug)) {
        return prev.filter((b) => b.slug !== article.slug);
      }
      return [
        { ...article, savedAt: new Date().toISOString() },
        ...prev,
      ];
    });
  }

  function remove(slug: string) {
    setBookmarks((prev) => prev.filter((b) => b.slug !== slug));
  }

  function clear() {
    setBookmarks([]);
  }

  return { bookmarks, isBookmarked, toggle, remove, clear };
}
