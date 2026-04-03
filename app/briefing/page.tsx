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

  // Get today's articles by signal score
  const { data: todayArticles } = await supabase
    .from("articles")
    .select("*")
    .gte("published_at", todayStart.toISOString())
    .order("signal_score", { ascending: false })
    .limit(30);

  const articles = (todayArticles as Article[]) ?? [];

  // If no articles today, get most recent
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

  // Region counts
  const regionCounts: Record<string, number> = {};
  for (const a of displayArticles) {
    const r = a.region || "global";
    regionCounts[r] = (regionCounts[r] || 0) + 1;
  }

  // Category counts
  const categoryCounts: Record<string, number> = {};
  for (const a of displayArticles) {
    const c = a.category || "Uncategorized";
    categoryCounts[c] = (categoryCounts[c] || 0) + 1;
  }

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
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

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green pulse-dot" />
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-accent-amber">
              Daily Briefing
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-text-primary mb-2">
            Your Morning Intelligence
          </h1>
          <p className="text-sm text-text-secondary font-mono">{dateStr}</p>
          <p className="text-sm text-text-secondary mt-2">
            {displayArticles.length} stories analyzed across{" "}
            {Object.keys(regionCounts).length} regions.{" "}
            {articles.length > 0 ? "Today's" : "Latest"} most important developments.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-10">
          {Object.entries(regionCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([region, count]) => (
              <div
                key={region}
                className="text-center p-3 rounded-lg border border-border bg-surface"
              >
                <p className="text-xl font-mono text-accent-amber font-semibold">
                  {count}
                </p>
                <p className="text-[10px] font-mono text-text-secondary tracking-wider uppercase mt-1">
                  {REGION_LABELS[region] ?? region}
                </p>
              </div>
            ))}
        </div>

        {/* Top Stories */}
        <section className="mb-12">
          <h2 className="font-mono text-xs tracking-[0.2em] uppercase text-accent-amber mb-6 flex items-center gap-3">
            <span>Top Stories</span>
            <span className="flex-1 h-px bg-border" />
          </h2>

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
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              article.signal_score >= 75
                                ? "bg-accent-amber"
                                : article.signal_score >= 50
                                  ? "bg-accent-amber/60"
                                  : "bg-text-secondary/30"
                            }`}
                            style={{ width: `${article.signal_score}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-text-secondary">
                          Signal {article.signal_score}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="absolute top-4 right-4">
                  <BookmarkButton article={article} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Active Sectors */}
        {Object.keys(categoryCounts).length > 0 && (
          <section className="mb-12">
            <h2 className="font-mono text-xs tracking-[0.2em] uppercase text-accent-amber mb-4 flex items-center gap-3">
              <span>Active Sectors</span>
              <span className="flex-1 h-px bg-border" />
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => (
                  <span
                    key={cat}
                    className="text-xs font-mono px-3 py-1.5 rounded-full border border-border bg-surface text-text-secondary"
                  >
                    {cat}{" "}
                    <span className="text-accent-amber ml-1">{count}</span>
                  </span>
                ))}
            </div>
          </section>
        )}

        {/* More Stories */}
        {rest.length > 0 && (
          <section>
            <h2 className="font-mono text-xs tracking-[0.2em] uppercase text-accent-amber mb-6 flex items-center gap-3">
              <span>More Intelligence</span>
              <span className="flex-1 h-px bg-border" />
            </h2>
            <div className="space-y-2">
              {rest.map((article) => (
                <Link
                  key={article.id}
                  href={`/article/${article.slug}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-1 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent-amber/60"
                        style={{ width: `${article.signal_score}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-text-secondary tabular-nums w-6">
                      {article.signal_score}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-serif text-text-primary group-hover:text-accent-amber transition-colors truncate">
                      {article.headline}
                    </p>
                  </div>
                  {article.region && article.region !== "global" && (
                    <span className="text-[9px] font-mono text-text-secondary px-1.5 py-0.5 rounded bg-surface-elevated flex-shrink-0">
                      {REGION_LABELS[article.region] ?? article.region}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
