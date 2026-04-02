import Masthead from "../components/Masthead";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Vantage",
  description:
    "How Vantage works — an AI-native tri-signal tech intelligence platform.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Masthead />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-mono text-text-secondary hover:text-accent-amber transition-colors mb-8"
        >
          <span>&larr;</span> Back to all stories
        </a>

        <h2 className="font-serif text-3xl md:text-4xl text-text-primary mb-8">
          About Vantage
        </h2>

        <div className="article-prose space-y-6">
          <p>
            Vantage is an AI-native tech intelligence platform. Every article is
            produced by a tri-signal pipeline that cross-references traditional
            news wires with real-time social signals from Reddit and HackerNews,
            giving you not just what happened, but what builders, engineers, and
            the wider tech community are actually paying attention to.
          </p>

          <p>No human editors. No agenda. No delay.</p>

          <p>
            Stories that trend across all three signal sources score highest.
            Single-source stories score lower. The signal score tells you what
            matters before the mainstream catches up.
          </p>
        </div>

        <div className="mt-16 pt-8 border-t border-border">
          <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-accent-amber mb-6">
            Tri-Signal Methodology
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-lg bg-surface border border-border">
              <span className="text-xs font-mono text-accent-amber tracking-wider uppercase">
                Signal 1 — News
              </span>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                Top tech headlines from major wire services and publications. The
                institutional signal: what traditional media is covering.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-surface border border-border">
              <span className="text-xs font-mono text-purple-400 tracking-wider uppercase">
                Signal 2 — Reddit
              </span>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                Trending discussions from r/technology, r/programming,
                r/artificial, r/machinelearning, r/startups. The community
                signal: what developers and users are actually saying.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-surface border border-border">
              <span className="text-xs font-mono text-orange-400 tracking-wider uppercase">
                Signal 3 — HackerNews
              </span>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                Top stories and Show HN posts. The builder signal: what
                founders, engineers, and the startup ecosystem care about. Often
                reveals technical depth mainstream coverage misses.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-accent-amber mb-6">
            How It Works
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-lg bg-surface border border-border">
              <span className="text-xs font-mono text-text-secondary tracking-wider uppercase">
                Analysis Engine
              </span>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                Claude cross-references all three signals and writes structured
                analytical articles. Each article includes: what happened, why it
                matters, who wins and loses, and what to watch next.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-surface border border-border">
              <span className="text-xs font-mono text-text-secondary tracking-wider uppercase">
                Ask Vantage
              </span>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                Every article includes an inline AI chat. Ask follow-up questions
                and get sharp, analytical answers grounded in the
                article&apos;s context.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-surface border border-border">
              <span className="text-xs font-mono text-text-secondary tracking-wider uppercase">
                Signal Scoring
              </span>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                Each story gets a 1-100 signal score based on how many sources
                are covering it and the engagement it&apos;s generating.
                Tri-signal stories (all three sources) always score highest.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-surface border border-border">
              <span className="text-xs font-mono text-text-secondary tracking-wider uppercase">
                Global Coverage
              </span>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                The pipeline covers 6 regions: Global, Africa, Asia, Europe,
                Americas, and Middle East. Stories are generated continuously
                with breaking news covered in real time via on-demand triggers.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
