import Masthead from "./components/Masthead";
import ArticleFeed from "./components/ArticleFeed";
import DigestSignup from "./components/DigestSignup";
import KeyboardShortcuts from "./components/KeyboardShortcuts";
import { supabase, type Article } from "./lib/supabase";

export const revalidate = 120;

export default async function HomePage() {
  // Only show articles from last 24 hours — always fresh
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("articles")
    .select("*")
    .gte("published_at", cutoff)
    .order("published_at", { ascending: false })
    .limit(30);

  const articles = (data as Article[]) ?? [];

  const { count } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .gte("published_at", cutoff);

  const totalCount = count ?? 0;
  const lastUpdated = articles.length > 0 ? articles[0].published_at : null;

  return (
    <div className="min-h-screen flex flex-col relative">
      <KeyboardShortcuts />
      <Masthead />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <ArticleFeed
          initialArticles={articles}
          totalCount={totalCount}
          lastUpdated={lastUpdated}
        />
      </main>

      <DigestSignup />

      <footer className="border-t border-border mt-auto bg-surface/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-[10px] sm:text-xs text-text-secondary/50 font-mono">
            &copy; {new Date().getFullYear()} Vantage
          </p>
        </div>
      </footer>
    </div>
  );
}
