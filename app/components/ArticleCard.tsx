import Link from "next/link";
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

const CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  AI: { bg: "bg-amber-500/8", text: "text-amber-400", bar: "bg-amber-400" },
  Infrastructure: { bg: "bg-blue-500/8", text: "text-blue-400", bar: "bg-blue-400" },
  Startups: { bg: "bg-emerald-500/8", text: "text-emerald-400", bar: "bg-emerald-400" },
  "Big Tech": { bg: "bg-purple-500/8", text: "text-purple-400", bar: "bg-purple-400" },
  Policy: { bg: "bg-red-500/8", text: "text-red-400", bar: "bg-red-400" },
  Markets: { bg: "bg-cyan-500/8", text: "text-cyan-400", bar: "bg-cyan-400" },
};

const DEFAULT_COLORS = { bg: "bg-accent-amber/8", text: "text-accent-amber", bar: "bg-accent-amber" };

function SignalBadge({ sources }: { sources: string[] }) {
  if (sources.length >= 3) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-accent-amber/10 text-accent-amber border border-accent-amber/20">
        <span className="w-1 h-1 rounded-full bg-accent-amber pulse-dot" />
        Tri-Signal
      </span>
    );
  }
  if (sources.length === 2) {
    return (
      <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
        Dual Signal
      </span>
    );
  }
  return null;
}

function ScoreIndicator({ score }: { score: number }) {
  const color =
    score >= 70
      ? "text-accent-red"
      : score >= 40
        ? "text-accent-amber"
        : "text-accent-green";
  const bg =
    score >= 70
      ? "bg-accent-red/10"
      : score >= 40
        ? "bg-accent-amber/10"
        : "bg-accent-green/10";

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono ${color} ${bg} px-2 py-0.5 rounded-full`}>
      {score}
    </span>
  );
}

export default function ArticleCard({
  article,
  featured = false,
}: {
  article: Article;
  featured?: boolean;
}) {
  const colors = CATEGORY_COLORS[article.category ?? ""] ?? DEFAULT_COLORS;
  const signalSources = article.signal_sources ?? [];

  if (featured) {
    return (
      <Link href={`/article/${article.slug}`} className="group block">
        <article className="relative rounded-xl border border-border bg-surface-elevated overflow-hidden card-glow featured-glow">
          <div className="flex">
            {/* Category accent bar */}
            <div className={`category-bar ${colors.bar} flex-shrink-0`} />

            <div className="flex-1 p-6 sm:p-8 md:p-10">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className={`text-xs font-mono tracking-wider uppercase ${colors.text}`}>
                  {article.category}
                </span>
                <SignalBadge sources={signalSources} />
                {article.region && article.region !== "global" && (
                  <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-border text-text-secondary">
                    {REGION_LABELS[article.region] ?? article.region}
                  </span>
                )}
                <ScoreIndicator score={article.signal_score} />
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-text-primary group-hover:text-accent-amber transition-colors leading-tight mb-3">
                {article.headline}
              </h2>

              {article.subheadline && (
                <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-4 line-clamp-2">
                  {article.subheadline}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-text-secondary font-mono">
                <span>{timeAgo(article.published_at)}</span>
                <span>{Math.ceil(article.full_body.split(" ").length / 200)} min read</span>
                {signalSources.length > 0 && (
                  <div className="flex items-center gap-1">
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
                <span className="ml-auto text-accent-amber/60 group-hover:text-accent-amber transition-colors">
                  Read analysis &rarr;
                </span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/article/${article.slug}`} className="group block">
      <article className="relative h-full rounded-lg border border-border bg-surface overflow-hidden card-glow">
        <div className="flex h-full">
          {/* Category accent bar */}
          <div className={`category-bar ${colors.bar} flex-shrink-0`} />

          <div className="flex-1 flex flex-col p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`text-[11px] font-mono tracking-wider uppercase ${colors.text}`}>
                {article.category}
              </span>
              <SignalBadge sources={signalSources} />
              {article.region && article.region !== "global" && (
                <span className="text-[10px] font-mono text-text-secondary px-1.5 py-0.5 rounded bg-border/50">
                  {REGION_LABELS[article.region] ?? article.region}
                </span>
              )}
            </div>

            <h2 className="font-serif text-lg sm:text-xl text-text-primary group-hover:text-accent-amber transition-colors leading-snug mb-2 line-clamp-3">
              {article.headline}
            </h2>

            {article.subheadline && (
              <p className="text-sm text-text-secondary leading-relaxed mb-3 line-clamp-2 flex-1">
                {article.subheadline}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t border-border/50">
              <div className="flex items-center gap-2 text-[11px] text-text-secondary font-mono">
                <span>{timeAgo(article.published_at)}</span>
                <span className="text-border">/</span>
                <span>{Math.ceil(article.full_body.split(" ").length / 200)}m</span>
                {signalSources.length > 0 && (
                  <div className="flex items-center gap-1 ml-1">
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
              <ScoreIndicator score={article.signal_score} />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
