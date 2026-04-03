"use client";

import { useState, useEffect } from "react";
import ArticleCard from "./ArticleCard";
import { SkeletonFeed } from "./SkeletonCard";
import type { Article } from "../lib/supabase";

export default function ArticleFeed({
  initialArticles,
}: {
  initialArticles: Article[];
  totalCount: number;
  lastUpdated: string | null;
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [loading, setLoading] = useState(false);

  // Auto-refresh every 2 minutes for real-time feel
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/articles");
        if (res.ok) {
          const data = await res.json();
          if (data.articles.length > 0) {
            setArticles(data.articles);
          }
        }
      } catch {
        // Silent — don't break the UI
      }
    }, 120_000);
    return () => clearInterval(interval);
  }, []);

  const [hero, ...rest] = articles;

  return (
    <>
      {loading ? (
        <SkeletonFeed />
      ) : articles.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-text-secondary font-serif text-xl italic">
            Intelligence is being gathered.
          </p>
          <p className="mt-2 text-text-secondary font-mono text-sm">
            Fresh analysis drops every 2 hours.
          </p>
        </div>
      ) : (
        <div className="stagger-children">
          {hero && (
            <div className="mb-6">
              <ArticleCard article={hero} featured />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {rest.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
