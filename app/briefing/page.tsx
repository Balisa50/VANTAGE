import Link from "next/link";
import Masthead from "../components/Masthead";
import BookmarkButton from "../components/BookmarkButton";
import LiveTimestamp from "../components/LiveTimestamp";
import { supabase, type Article } from "../lib/supabase";

export const revalidate = 120;

const REGION_LABELS: Record<string, string> = {
  global: "Global",
  africa: "Africa",
  asia: "Asia",
  europe: "Europe",
  americas: "Americas",
  middleeast: "Middle East",
};

export default async function BriefingPage() {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data: todayArticles } = await supabase
    .from("articles")
    .select("*")
    .gte("published_at", todayStart.toISOString())
    .order("signal_score", { ascending: false })
    .limit(30);

  const articles = (todayArticles as Article[]) ?? [];

  let fallbackArticles: Article[] = [];
  if (articles.length === 0) {
    const { data } = await supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(15);
    fallbackArticles = (data as Article[]) ?? [];
  }

  const displayArticles = articles.length > 0 ? articles : fallbackArticles;
  const top5 = displayArticles.slice(0, 5);
  const rest = displayArticles.slice(5);

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen">
      <Masthead />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-mono text-text-secondary hover:text-accent-amber transition-colors mb-8"
        >
          <span>&larr;</span> Back
        </a>

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green pulse-dot" />
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-accent-amber">
              Daily Briefing
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-text-primary">
            {dateStr}
          </h1>
        </div>

        <section className="mb-12">
          <div className="space-y-4">
            {top5.map((article, i) => (
              <div key={article.id} className="relative group">
                <Link
                  href={`/article/${article.slug}`}
                  className="flex gap-4 sm:gap-6 p-4 sm:p-5 rounded-lg border border-border bg-surface hover:border-accent-amber/15 transition-all"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-elevated border border-accent-amber/20 flex items-center justify-center">
                    <span className="text-xs font-mono text-accent-amber font-semibold">
                      {i + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
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
                      <LiveTimestamp date={article.published_at} />
                    </div>
                    <h3 className="font-serif text-lg sm:text-xl text-text-primary group-hover:text-accent-amber transition-colors leading-snug">
                      {article.headline}
                    </h3>
                    {article.subheadline && (
                      <p className="text-sm text-text-secondary mt-1.5 line-clamp-2">
                        {article.subheadline}
                      </p>
                    )}
                  </div>
                </Link>
                <div className="absolute top-4 right-4">
                  <BookmarkButton article={article} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {rest.length > 0 && (
          <section>
            <div className="space-y-2">
              {rest.map((article) => (
                <Link
                  key={article.id}
                  href={`/article/${article.slug}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {article.category && (
                        <span className="text-[10px] font-mono tracking-wider uppercase text-accent-amber">
                          {article.category}
                        </span>
                      )}
                      {article.region && article.region !== "global" && (
                        <span className="text-[9px] font-mono text-text-secondary px-1.5 py-0.5 rounded bg-surface-elevated">
                          {REGION_LABELS[article.region] ?? article.region}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-serif text-text-primary group-hover:text-accent-amber transition-colors truncate">
                      {article.headline}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
