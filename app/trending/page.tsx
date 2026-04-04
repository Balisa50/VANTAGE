import Masthead from "../components/Masthead";
import TrendingBoard from "../components/TrendingBoard";
import VirloPulse from "../components/VirloPulse";
import { supabase, type Article } from "../lib/supabase";

export const revalidate = 120;

export default async function TrendingPage() {
  const since24h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("articles")
    .select("*")
    .gte("published_at", since24h)
    .order("signal_score", { ascending: false })
    .limit(50);

  const articles = (data as Article[]) ?? [];

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

        <VirloPulse />
        <TrendingBoard initialArticles={articles} />
      </main>
    </div>
  );
}
