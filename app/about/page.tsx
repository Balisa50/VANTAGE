import Masthead from "../components/Masthead";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works | Vantage",
  description:
    "How Vantage delivers tech intelligence — automated, opinionated, and global.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Masthead />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-mono text-text-secondary hover:text-accent-amber transition-colors mb-10"
        >
          <span>&larr;</span> Back
        </a>

        <h2 className="font-serif text-3xl md:text-4xl text-text-primary mb-4">
          Intelligence, not information.
        </h2>
        <p className="text-text-secondary text-base leading-relaxed mb-12 max-w-2xl">
          Most tech news tells you what happened. Vantage tells you what it means, who it affects, and what comes next.
        </p>

        <div className="space-y-0 mb-16">
          <PipelineStep
            number="01"
            title="Vantage scans the global conversation"
            description="Thousands of sources across the tech world: wire services, developer communities, builder forums, and regional publications. Not just what journalists are writing, but what engineers, founders, and the broader tech community are actually talking about."
          />
          <PipelineStep
            number="02"
            title="Stories are ranked by real-world signal"
            description="Not all stories are equal. Vantage weighs each story based on how many independent sources are discussing it and how much engagement it's generating. A story buzzing across multiple communities carries more weight than a single press release."
          />
          <PipelineStep
            number="03"
            title="Every article is a proper analysis"
            description="Vantage doesn't rewrite headlines. Each story gets a full editorial treatment: what happened, why it matters, who wins and loses, and what to watch next. If something is a strategic mistake, Vantage says so. If it changes everything, Vantage explains why."
          />
          <PipelineStep
            number="04"
            title="Built for the whole world"
            description="The best tech stories are coming from every corner of the globe. Vantage covers six regions and frames each story through the lens that matters most, whether that's Nairobi's fintech boom, Seoul's semiconductor wars, or Brussels' regulatory machine."
            last
          />
        </div>

        <div className="border-t border-border pt-12">
          <h3 className="font-serif text-2xl text-text-primary mb-8">
            What you can do
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FeatureCard
              title="Ask questions on any story"
              description="Every article has a built-in conversation layer. Ask a follow-up, challenge the analysis, or go deeper on any angle."
            />
            <FeatureCard
              title="Search — and always find"
              description="If we don't have it, Vantage generates a full analysis on the spot. You will never hit a dead end."
            />
            <FeatureCard
              title="Your daily briefing"
              description="The most important stories ranked by signal strength. Your morning in 2 minutes."
            />
            <FeatureCard
              title="Save what matters"
              description="Bookmark articles to come back to later. No account needed."
            />
            <FeatureCard
              title="Social pulse via Virlo"
              description="See what's going viral across TikTok, YouTube, and Instagram in real time. Powered by Virlo's trend intelligence API."
            />
          </div>
        </div>

        <div className="border-t border-border pt-12 mt-12">
          <h3 className="font-serif text-2xl text-text-primary mb-4">
            Why this exists
          </h3>
          <div className="article-prose">
            <p className="text-text-secondary">
              The tech news ecosystem is broken. Wire services optimize for speed, not depth. Opinion pieces optimize for engagement, not accuracy. And most of it is written for a single market.
            </p>
            <p className="text-text-secondary">
              Vantage is built on a simple premise: the best intelligence comes from cross-referencing multiple sources, not relying on any single one. When traditional media, developer communities, and builder forums all converge on the same story, that story matters. When they diverge, that divergence is the story.
            </p>
            <p className="text-text-secondary">
              No editors. No sponsors. No agenda. Just signal.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function PipelineStep({
  number,
  title,
  description,
  last = false,
}: {
  number: string;
  title: string;
  description: string;
  last?: boolean;
}) {
  return (
    <div className="flex gap-4 sm:gap-6">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-surface-elevated border border-accent-amber/20 flex items-center justify-center">
          <span className="text-[10px] font-mono text-accent-amber">{number}</span>
        </div>
        {!last && <div className="w-px flex-1 bg-border my-1" />}
      </div>
      <div className="pb-8">
        <h4 className="font-serif text-lg text-text-primary mb-2">{title}</h4>
        <p className="text-sm text-text-secondary leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-5 rounded-lg bg-surface border border-border">
      <h4 className="text-sm font-serif text-text-primary mb-2">{title}</h4>
      <p className="text-sm text-text-secondary leading-relaxed">
        {description}
      </p>
    </div>
  );
}
