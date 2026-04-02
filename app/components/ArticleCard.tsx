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

function SignalBadge({ sources }: { sources: string[] }) {
  if (sources.length >= 3) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-accent-amber/10 text-accent-amber border border-accent-amber/15">
        <span className="w-1 h-1 rounded-full bg-accent-amber pulse-dot" />
        Tri-Signal
      </span>
    );
  }
  if (sources.length === 2) {
    return (
      <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-text-secondary/5 text-text-secondary border border-border">
        Dual Signal
      </span>
    );
  }
  return null;
}

function ScoreIndicator({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center text-xs font-mono text-text-secondary tabular-nums">
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
  const signalSources = article.signal_sources ?? [];

  if (featured) {
    return (
      <Link href={`/article/${article.slug}`} className="group block">
        <article className="rounded-lg border border-border bg-surface overflow-hidden card-glow">
          <div className="p-5 sm:p-8 md:p-10">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {article.category && (
                <span className="text-xs font-mono tracking-wider uppercase text-accent-amber">
                  {article.category}
                </span>
              )}
              <SignalBadge sources={signalSources} />
              {article.region && article.region !== "global" && (
                <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-surface-elevated text-text-secondary">
                  {REGION_LABELS[article.region] ?? article.region}
                </span>
              )}
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-text-primary group-hover:text-accent-amber transition-colors leading-tight mb-3">
              {article.headline}
            </h2>

            {article.subheadline && (
              <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-5 line-clamp-2">
                {article.subheadline}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-text-secondary font-mono pt-4 border-t border-border/50">
              <span>{timeAgo(article.published_at)}</span>
              <span>{Math.ceil(article.full_body.split(" ").length / 200)} min read</span>
              <ScoreIndicator score={article.signal_score} />
              <span className="ml-auto text-text-secondary/40 group-hover:text-accent-amber transition-colors">
                Read &rarr;
              </span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/article/${article.slug}`} className="group block">
      <article className="relative h-full rounded-lg border border-border bg-surface overflow-hidden card-glow">
        <div className="flex flex-col h-full p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {article.category && (
              <span className="text-[11px] font-mono tracking-wider uppercase text-accent-amber">
                {article.category}
              </span>
            )}
            <SignalBadge sources={signalSources} />
            {article.region && article.region !== "global" && (
              <span className="text-[10px] font-mono text-text-secondary px-1.5 py-0.5 rounded bg-surface-elevated">
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
            </div>
            <ScoreIndicator score={article.signal_score} />
          </div>
        </div>
      </article>
    </Link>
  );
}
