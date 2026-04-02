import { Suspense } from "react";
import { notFound } from "next/navigation";
import { supabase, type Article } from "../../lib/supabase";
import Masthead from "../../components/Masthead";
import ArticleBody from "../../components/ArticleBody";
import ChatWidget from "../../components/ChatWidget";
import SignalScore from "../../components/SignalScore";
import ReadingProgress from "../../components/ReadingProgress";
import ShareButtons from "../../components/ShareButtons";
import RelatedArticles from "../../components/RelatedArticles";

export const revalidate = 3600;

const CATEGORY_GRADIENTS: Record<string, string> = {
  AI: "from-amber-500/8 to-orange-500/3",
  Infrastructure: "from-blue-500/8 to-cyan-500/3",
  Startups: "from-green-500/8 to-emerald-500/3",
  "Big Tech": "from-purple-500/8 to-violet-500/3",
  Policy: "from-red-500/8 to-rose-500/3",
  Markets: "from-teal-500/8 to-sky-500/3",
};

const REGION_LABELS: Record<string, string> = {
  global: "Global",
  africa: "Africa",
  asia: "Asia",
  europe: "Europe",
  americas: "Americas",
  middleeast: "Middle East",
};

async function getArticle(slug: string): Promise<Article | null> {
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .single();
  return data as Article | null;
}

export async function generateStaticParams() {
  const { data } = await supabase.from("articles").select("slug");
  return (data ?? []).map((a: { slug: string }) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};
  return {
    title: `${article.headline} | Vantage`,
    description: article.subheadline ?? article.headline,
    openGraph: {
      title: article.headline,
      description: article.subheadline ?? article.headline,
      type: "article",
      publishedTime: article.published_at,
      siteName: "Vantage",
    },
    twitter: {
      card: "summary_large_image",
      title: article.headline,
      description: article.subheadline ?? article.headline,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const publishedDate = new Date(article.published_at).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const gradient =
    CATEGORY_GRADIENTS[article.category ?? ""] ??
    "from-accent-amber/8 to-accent-amber/3";
  const signalSources = article.signal_sources ?? [];
  const signalCount = signalSources.length;
  const regionLabel = REGION_LABELS[article.region ?? "global"] ?? "Global";

  return (
    <div className="min-h-screen">
      <ReadingProgress />
      <Masthead />

      {/* Category gradient hero */}
      <div className={`bg-gradient-to-br ${gradient}`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-mono text-text-secondary hover:text-accent-amber transition-colors mb-8"
          >
            <span>&larr;</span> Back to all stories
          </a>

          <header>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {article.category && (
                <span className="inline-block text-xs font-mono tracking-[0.2em] uppercase text-accent-amber">
                  {article.category}
                </span>
              )}
              {article.region && article.region !== "global" && (
                <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-border text-text-secondary">
                  {regionLabel}
                </span>
              )}
              {signalCount >= 3 && (
                <span className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-full bg-accent-amber/15 text-accent-amber border border-accent-amber/20">
                  Tri-Signal: News + Reddit + HN
                </span>
              )}
              {signalCount === 2 && (
                <span className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20">
                  Dual Signal
                </span>
              )}
            </div>
            <h1 className="font-serif text-3xl md:text-5xl leading-tight text-text-primary">
              {article.headline}
            </h1>
            {article.subheadline && (
              <p className="mt-4 text-lg text-text-secondary leading-relaxed">
                {article.subheadline}
              </p>
            )}
            <div className="mt-6 flex items-center gap-6 flex-wrap">
              <time className="text-sm text-text-secondary font-mono">
                {publishedDate}
              </time>
              <span className="text-sm text-text-secondary font-mono">
                {Math.ceil(article.full_body.split(" ").length / 200)} min read
              </span>
              <div className="flex-1 max-w-56">
                <SignalScore score={article.signal_score} />
              </div>
            </div>
            <div className="mt-4">
              <ShareButtons headline={article.headline} slug={article.slug} />
            </div>
          </header>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <ArticleBody article={article} />
        <ChatWidget articleBody={article.full_body} />

        <Suspense fallback={null}>
          <RelatedArticles
            currentSlug={article.slug}
            category={article.category}
            region={article.region}
          />
        </Suspense>
      </main>
    </div>
  );
}
