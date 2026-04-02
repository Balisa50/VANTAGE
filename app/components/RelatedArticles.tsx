import Link from "next/link";
import type { Article } from "../lib/supabase";
import { supabase } from "../lib/supabase";

export default async function RelatedArticles({
  currentSlug,
  category,
  region,
}: {
  currentSlug: string;
  category: string | null;
  region: string | null;
}) {
  // Fetch articles in same category, excluding current
  const { data } = await supabase
    .from("articles")
    .select("slug, headline, category, signal_score, published_at, region")
    .neq("slug", currentSlug)
    .eq("category", category ?? "AI")
    .order("published_at", { ascending: false })
    .limit(3);

  const related = (data as Pick<Article, "slug" | "headline" | "category" | "signal_score" | "published_at" | "region">[]) ?? [];

  if (related.length === 0) return null;

  return (
    <section className="mt-16 pt-8 border-t border-border">
      <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-accent-amber mb-6">
        Related Intelligence
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {related.map((article) => (
          <Link
            key={article.slug}
            href={`/article/${article.slug}`}
            className="group p-4 rounded-lg bg-surface border border-border hover:border-accent-amber/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono tracking-wider uppercase text-accent-amber">
                {article.category}
              </span>
              <span
                className={`text-[10px] font-mono ${
                  article.signal_score >= 70
                    ? "text-accent-red"
                    : "text-text-secondary"
                }`}
              >
                {article.signal_score}
              </span>
            </div>
            <p className="text-sm font-serif text-text-primary group-hover:text-accent-amber transition-colors leading-snug line-clamp-3">
              {article.headline}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
