import type { Article } from "../lib/supabase";

function Section({
  label,
  content,
}: {
  label: string;
  content: string | null;
}) {
  if (!content) return null;
  return (
    <section className="mb-10">
      <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-accent-amber mb-4">
        {label}
      </h3>
      <div className="article-prose">
        {content.split("\n").map((p, i) =>
          p.trim() ? <p key={i}>{p}</p> : null
        )}
      </div>
    </section>
  );
}

export default function ArticleBody({ article }: { article: Article }) {
  return (
    <div>
      <Section label="What Happened" content={article.what_happened} />
      <Section label="Why It Matters" content={article.why_it_matters} />
      <Section label="Who Wins & Loses" content={article.who_wins_loses} />
      <Section label="What to Watch" content={article.what_to_watch} />

      {article.social_context &&
        !article.social_context.toLowerCase().includes("no significant social signal") && (
          <section className="mb-10 p-5 rounded-lg bg-purple-500/5 border border-purple-500/15">
            <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-purple-400 mb-4 flex items-center gap-2">
              Social Pulse
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">
                Reddit
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400">
                HackerNews
              </span>
            </h3>
            <div className="article-prose">
              {article.social_context.split("\n").map((p, i) =>
                p.trim() ? <p key={i}>{p}</p> : null
              )}
            </div>
          </section>
        )}

      {article.signal_sources && article.signal_sources.length > 0 && (
        <div className="mb-8 flex items-center gap-2">
          <span className="text-xs font-mono text-text-secondary">Signal sources:</span>
          {article.signal_sources.map((src, i) => (
            <span
              key={i}
              className={`text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full border ${
                src === "Reddit" || src === "Social"
                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                  : src === "HackerNews"
                    ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                    : "bg-accent-amber/10 text-accent-amber border-accent-amber/20"
              }`}
            >
              {src}
            </span>
          ))}
        </div>
      )}

      {article.source_headlines && article.source_headlines.length > 0 && (
        <section className="mt-12 pt-8 border-t border-border">
          <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-text-secondary mb-4">
            Sources
          </h3>
          <ul className="space-y-2">
            {article.source_headlines.map((title, i) => (
              <li key={i} className="text-sm text-text-secondary">
                {article.source_urls?.[i] ? (
                  <a
                    href={article.source_urls[i]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent-amber transition-colors"
                  >
                    {title}
                  </a>
                ) : (
                  title
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
