"use client";

import { useState } from "react";
import ArticleCard from "./ArticleCard";
import CategoryFilter from "./CategoryFilter";
import RegionSelector from "./RegionSelector";
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
  const [category, setCategory] = useState("All");
  const [region, setRegion] = useState("all");
  const [loading, setLoading] = useState(false);

  async function applyFilters(cat: string, reg: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cat !== "All") params.set("category", cat);
      if (reg !== "all") params.set("region", reg);

      const res = await fetch(`/api/articles?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles);
      }
    } catch {
      let filtered = initialArticles;
      if (cat !== "All") filtered = filtered.filter((a) => a.category === cat);
      if (reg !== "all") filtered = filtered.filter((a) => a.region === reg);
      setArticles(filtered);
    } finally {
      setLoading(false);
    }
  }

  function handleCategory(cat: string) {
    setCategory(cat);
    if (cat === "All" && region === "all") {
      setArticles(initialArticles);
      return;
    }
    applyFilters(cat, region);
  }

  function handleRegion(reg: string) {
    setRegion(reg);
    if (reg === "all" && category === "All") {
      setArticles(initialArticles);
      return;
    }
    applyFilters(category, reg);
  }

  const [hero, ...rest] = articles;

  return (
    <>
      <div className="space-y-3 mb-8">
        <CategoryFilter active={category} onChange={handleCategory} />
        <RegionSelector active={region} onChange={handleRegion} />
      </div>

      {loading ? (
        <SkeletonFeed />
      ) : articles.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-text-secondary font-serif text-xl italic">
            No stories match these filters yet.
          </p>
          <p className="mt-2 text-text-secondary font-mono text-sm">
            New stories are published throughout the day.
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
