import Link from "next/link";
import SignalScore from "./SignalScore";
import type { Article } from "../lib/supabase";

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

const REGION_LABELS: Record<string, string> = {
  global: "Global",
  africa: "Africa",
  asia: "Asia",
  europe: "Europe",
  americas: "Americas",
  middleeast: "Middle East",
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  AI: "from-amber-500/10 to-orange-500/5",
  Infrastructure: "from-blue-500/10 to-cyan-500/5",
  Startups: "from-green-500/10 to-emerald-500/5",
  "Big Tech": "from-purple-500/10 to-violet-500/5",
  Policy: "from-red-500/10 to-rose-500/5",
  Markets: "from-teal-500/10 to-sky-500/5",
};

const CATEGORY_ACCENT: Record<string, string> = {
  AI: "text-amber-400",
  Infrastructure: "text-blue-400",
  Startups: "text-green-400",
  "Big Tech": "text-purple-400",
  Policy: "text-red-400",
  Markets: "text-teal-400",
};

export default function ArticleCard({
  article,
  featured = false,
}: {
  article: Article;
  featured?: boolean;
}) {
  const gradient =
    CATEGORY_GRADIENTS[article.category ?? ""] ?? "from-accent-amber/10 to-accent-amber/5";
  const accent =
    CATEGORY_ACCENT[article.category ?? ""] ?? "text-accent-amber";
  const signalSources = article.signal_sources ?? [];
  const signalCount = signalSources.length;

  return (
    <Link href={`/article/${article.slug}`} className="group block">
      <article className="rounded-lg border border-border bg-surface hover:border-accent-amber/30 transition-all duration-300 overflow-hidden">
        {/* Category gradient header */}
        <div
          className={`bg-gradient-to-br ${gradient} ${
            featured ? "px-5 py-6 sm:px-8 sm:py-10" : "px-4 py-5 sm:px-6 sm:py-6"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            {article.category && (
              <span
                className={`text-xs font-mono tracking-wider uppercase ${accent}`}
              >
                {article.category}
              </span>
            )}
            {signalCount >= 3 && (
              <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-accent-amber/15 text-accent-amber border border-accent-amber/20">
                Tri-Signal
              </span>
            )}
            {signalCount === 2 && (
              <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20">
                Dual Signal
              </span>
            )}
          </div>
          <h2
            className={`font-serif text-text-primary group-hover:text-accent-amber transition-colors leading-tight ${
              featured ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
            }`}
          >
            {article.headline}
          </h2>
          {article.subheadline && (
            <p
              className={`mt-3 text-text-secondary leading-relaxed ${
                featured ? "text-lg" : "text-sm"
              }`}
            >
              {article.subheadline}
            </p>
          )}
        </div>

        <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-border/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
              <span className="text-xs text-text-secondary font-mono">
                {timeAgo(article.published_at)}
              </span>
              <span className="text-xs text-text-secondary font-mono">
                {Math.ceil(article.full_body.split(" ").length / 200)} min read
              </span>
              {article.region && article.region !== "global" && (
                <span className="text-[10px] font-mono text-text-secondary px-1.5 py-0.5 rounded bg-border/50">
                  {REGION_LABELS[article.region] ?? article.region}
                </span>
              )}
              {signalSources.length > 0 && (
                <div className="flex items-center gap-1.5">
                  {signalSources.map((src, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        src === "HackerNews"
                          ? "bg-orange-400"
                          : src === "Reddit"
                            ? "bg-purple-400"
                            : "bg-accent-amber"
                      }`}
                      title={src}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 max-w-48">
              <SignalScore score={article.signal_score} />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
