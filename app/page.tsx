import Masthead from "./components/Masthead";
import ArticleFeed from "./components/ArticleFeed";
import DigestSignup from "./components/DigestSignup";
import KeyboardShortcuts from "./components/KeyboardShortcuts";
import { supabase, type Article } from "./lib/supabase";

export const revalidate = 300;

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function HomePage() {
  const { data } = await supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(20);

  const articles = (data as Article[]) ?? [];

  const { count } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true });

  const totalCount = count ?? 0;
  const lastUpdated = articles.length > 0 ? articles[0].published_at : null;

  // Count unique regions and sources
  const regionSet = new Set(articles.map((a) => a.region).filter(Boolean));
  const triSignalCount = articles.filter(
    (a) => (a.signal_sources?.length ?? 0) >= 3
  ).length;

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Subtle noise texture */}
      <div className="noise-overlay" />

      <KeyboardShortcuts />
      <Masthead />

      {/* Stats ticker */}
      {totalCount > 0 && (
        <div className="border-b border-border bg-surface/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-4 sm:gap-8 text-[10px] sm:text-xs font-mono text-text-secondary">
            <span>
              <span className="text-text-primary font-medium">{totalCount}</span> stories
            </span>
            <span className="text-border">/</span>
            <span>
              <span className="text-text-primary font-medium">{regionSet.size}</span> regions
            </span>
            {triSignalCount > 0 && (
              <>
                <span className="text-border">/</span>
                <span>
                  <span className="text-accent-amber font-medium">{triSignalCount}</span> tri-signal
                </span>
              </>
            )}
            {lastUpdated && (
              <>
                <span className="text-border">/</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-accent-green pulse-dot" />
                  {timeAgo(lastUpdated)}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <ArticleFeed
          initialArticles={articles}
          totalCount={totalCount}
          lastUpdated={lastUpdated}
        />
      </main>

      <DigestSignup />

      <footer className="border-t border-border mt-auto bg-surface/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center space-y-2">
          <p className="text-[10px] sm:text-xs text-text-secondary font-mono leading-relaxed">
            Tri-signal intelligence powered by Claude. Global coverage across 6
            regions.
          </p>
          <p className="text-[10px] text-text-secondary/30 font-mono hidden sm:block">
            <kbd className="px-1 py-0.5 rounded bg-border/30 text-text-secondary/50">j</kbd>
            <kbd className="px-1 py-0.5 rounded bg-border/30 text-text-secondary/50 ml-1">k</kbd>{" "}
            navigate ·{" "}
            <kbd className="px-1 py-0.5 rounded bg-border/30 text-text-secondary/50">/</kbd> search ·{" "}
            <kbd className="px-1 py-0.5 rounded bg-border/30 text-text-secondary/50">Enter</kbd> open
          </p>
        </div>
      </footer>
    </div>
  );
}
