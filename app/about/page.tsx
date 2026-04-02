import Masthead from "../components/Masthead";
import type { Metadata } from "next";
import { supabase } from "../lib/supabase";

export const metadata: Metadata = {
  title: "How It Works | Vantage",
  description:
    "How Vantage's fully automated AI editorial pipeline works — from signal ingestion to published analysis.",
};

export const revalidate = 300;

export default async function AboutPage() {
  const { count: totalArticles } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true });

  return (
    <div className="min-h-screen">
      <Masthead />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-mono text-text-secondary hover:text-accent-amber transition-colors mb-8"
        >
          <span>&larr;</span> Back to feed
        </a>

        <h2 className="font-serif text-3xl md:text-4xl text-text-primary mb-3">
          How Vantage Works
        </h2>
        <p className="text-text-secondary text-sm font-mono mb-12">
          Fully automated. No human in the editorial path.
          {totalArticles ? ` ${totalArticles} articles published and counting.` : ""}
        </p>

        {/* Pipeline visualization */}
        <div className="space-y-0">
          <PipelineStep
            number="01"
            title="Signal Ingestion"
            description="Every cycle, the pipeline simultaneously queries four independent sources: NewsAPI wire services, Reddit community discussions, HackerNews builder conversations, and Virlo video trend data. Each source represents a different signal type with distinct editorial value."
            detail="News wires capture institutional reporting. Reddit captures community sentiment. HackerNews captures builder perspective. Virlo captures cultural momentum from short-form video."
          />
          <PipelineStep
            number="02"
            title="Cross-Signal Analysis"
            description="Raw signals are cross-referenced and deduplicated. Stories appearing across multiple sources receive higher signal scores. A story trending on HackerNews and Reddit simultaneously carries more editorial weight than a press release picked up by one wire service."
            detail="Signal scores range 1-100. Tri-signal stories (3+ sources) always score highest. Single-source stories are included but ranked lower."
          />
          <PipelineStep
            number="03"
            title="AI Editorial Pipeline"
            description="Each story is sent to Claude with full cross-signal context. The model produces structured analysis: what happened, why it matters, who wins and loses, what to watch next, and a social pulse synthesis. The editorial voice is opinionated and specific, not neutral wire copy."
            detail="Output is structured JSON with headline, subheadline, category, four analytical sections, full prose body (700+ words), and a signal score. Every article is publication-ready with no human editing."
          />
          <PipelineStep
            number="04"
            title="Regional Distribution"
            description="The pipeline runs across six regions: Global, Africa, Asia, Europe, Americas, and Middle East. Each region receives stories framed through its local tech ecosystem, regulatory landscape, and market dynamics. This is not US-centric tech news."
            detail="Regions auto-chain: one trigger cascades through all six. Breaking news can also be generated on-demand via webhook."
            last
          />
        </div>

        {/* Architecture */}
        <div className="mt-16 pt-8 border-t border-border">
          <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-accent-amber mb-6">
            Architecture
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ArchCard label="Frontend" value="Next.js with ISR" detail="Server-rendered, incrementally regenerated every 5 minutes" />
            <ArchCard label="Database" value="Supabase (Postgres)" detail="Articles, subscribers, with row-level security" />
            <ArchCard label="AI Engine" value="Claude Sonnet" detail="Structured analytical output with editorial voice" />
            <ArchCard label="Signal Sources" value="4 independent APIs" detail="NewsAPI, Reddit, HackerNews, Virlo" />
            <ArchCard label="Deployment" value="Vercel Edge" detail="Auto-deploy on push, daily cron + on-demand webhook" />
            <ArchCard label="Content" value="Fully automated" detail="Zero human editorial intervention required" />
          </div>
        </div>

        {/* Interactive features */}
        <div className="mt-12 pt-8 border-t border-border">
          <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-accent-amber mb-6">
            Reader Features
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ArchCard label="Ask Vantage" value="Article-level AI chat" detail="Ask follow-up questions on any article, get analytical answers" />
            <ArchCard label="Signal Scoring" value="1-100 per article" detail="Based on cross-source coverage and engagement signals" />
            <ArchCard label="Global Filters" value="Category + Region" detail="Filter by AI, Startups, Policy, etc. across 6 regions" />
            <ArchCard label="Search" value="Full-text, debounced" detail="Live search across all headlines and article bodies" />
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
  detail,
  last = false,
}: {
  number: string;
  title: string;
  description: string;
  detail: string;
  last?: boolean;
}) {
  return (
    <div className="flex gap-4 sm:gap-6">
      {/* Timeline */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-surface-elevated border border-accent-amber/20 flex items-center justify-center">
          <span className="text-[10px] font-mono text-accent-amber">{number}</span>
        </div>
        {!last && <div className="w-px flex-1 bg-border my-1" />}
      </div>

      {/* Content */}
      <div className={`pb-8 ${last ? "" : ""}`}>
        <h4 className="font-mono text-sm text-text-primary mb-2">{title}</h4>
        <p className="text-sm text-text-secondary leading-relaxed mb-2">
          {description}
        </p>
        <p className="text-xs text-text-secondary/60 font-mono leading-relaxed">
          {detail}
        </p>
      </div>
    </div>
  );
}

function ArchCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-surface border border-border">
      <span className="text-[10px] font-mono text-text-secondary tracking-wider uppercase">
        {label}
      </span>
      <p className="text-sm text-text-primary font-mono mt-1">{value}</p>
      <p className="text-xs text-text-secondary mt-1">{detail}</p>
    </div>
  );
}
