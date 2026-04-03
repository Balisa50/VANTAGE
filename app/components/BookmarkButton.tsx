"use client";

import { useBookmarks } from "../hooks/useBookmarks";

interface Props {
  article: {
    slug: string;
    headline: string;
    subheadline: string | null;
    category: string | null;
    region: string | null;
    signal_score: number;
    published_at: string;
  };
  size?: "sm" | "md";
}

export default function BookmarkButton({ article, size = "sm" }: Props) {
  const { isBookmarked, toggle } = useBookmarks();
  const saved = isBookmarked(article.slug);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(article);
      }}
      title={saved ? "Remove from saved" : "Save for later"}
      className={`group/bm flex items-center justify-center transition-all ${
        size === "md" ? "w-9 h-9" : "w-7 h-7"
      } rounded-lg ${
        saved
          ? "bg-accent-amber/15 text-accent-amber"
          : "bg-transparent text-text-secondary hover:text-accent-amber hover:bg-accent-amber/5"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className={size === "md" ? "w-5 h-5" : "w-4 h-4"}
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
    </button>
  );
}
