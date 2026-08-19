import Masthead from "../components/Masthead";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works | Vantage",
  description:
    "How Vantage collects technology stories, scores them, and writes them up.",
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
          How Vantage works
        </h2>
        <p className="text-text-secondary text-base leading-relaxed mb-12 max-w-2xl">
          Vantage collects technology stories, scores how widely each one is being discussed, and writes it up. It runs on a schedule with nobody in the loop.
        </p>

        <div className="space-y-0 mb-16">
          <PipelineStep
            number="01"
            title="It reads a spread of sources"
            description="Wire services, developer communities, builder forums and regional publications. The point of the spread is that the input includes what engineers and founders are discussing, alongside what reporters have filed."
          />
          <PipelineStep
            number="02"
            title="Stories are scored by how widely they are covered"
            description="Each story is weighted by how many independent sources are carrying it and how much engagement those sources are getting. Something running across several communities scores higher than a single press release."
          />
          <PipelineStep
            number="03"
            title="Each story is written up in full"
            description="An article covers what happened, who it affects and what to watch next, rather than a reworded headline. The write-up is generated from the sources, so it is a starting point: follow the links before relying on it."
          />
          <PipelineStep
            number="04"
            title="Six regions, framed locally"
            description="Coverage spans six regions, and each story is framed for where it comes from, whether that is fintech in Nairobi, semiconductors in Seoul or regulation in Brussels."
            last
          />
        </div>

        <div className="border-t border-border pt-12">
          <h3 className="font-serif text-2xl text-text-primary mb-8">
            What you can do
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FeatureCard
              title="Ask questions on a story"
              description="Each article has a chat attached to it, so you can ask a follow-up or push back on what the analysis claims."
            />
            <FeatureCard
              title="Search, or generate"
              description="If a story is not in the archive yet, searching for it writes the analysis on the spot."
            />
            <FeatureCard
              title="Daily briefing"
              description="The day's stories in score order, meant to be skimmed rather than read through."
            />
            <FeatureCard
              title="Save for later"
              description="Bookmark articles to come back to. No account needed."
            />
            <FeatureCard
              title="Social pulse via Virlo"
              description="What is trending on TikTok, YouTube and Instagram, pulled from Virlo's API."
            />
          </div>
        </div>

        <div className="border-t border-border pt-12 mt-12">
          <h3 className="font-serif text-2xl text-text-primary mb-4">
            Why this exists
          </h3>
          <div className="article-prose">
            <p className="text-text-secondary">
              Wire services move quickly and stay shallow, opinion pieces are written for engagement, and most of both is aimed at one market. I wanted something that read several kinds of source at once and used the overlap between them as the weighting.
            </p>
            <p className="text-text-secondary">
              Where traditional media, developer communities and builder forums land on the same story, it is probably worth your attention. Where they disagree, the disagreement is usually the more interesting thing.
            </p>
            <p className="text-text-secondary">
              There are no editors and no sponsors here. It is also fully automated, which is the honest limitation: the analysis is only as good as the sources it happened to read, and it can be wrong.
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
