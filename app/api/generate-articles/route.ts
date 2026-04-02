import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, ARTICLE_SYSTEM_PROMPT } from "../../lib/anthropic";
import { supabaseAdmin } from "../../lib/supabase";
import { fetchTopTechHeadlines, slugify, REGIONS } from "../../lib/newsapi";
import { fetchHNSignals, getHNAsHeadlines, formatHNContext } from "../../lib/hackernews";
import { fetchRegionalHeadlines, fetchGlobalHeadlines } from "../../lib/feeds";

export const maxDuration = 60;

const REGION_CHAIN = ["global", "africa", "asia", "europe", "americas", "middleeast"];

export async function GET(req: NextRequest) {
  return handleGenerate(req);
}

export async function POST(req: NextRequest) {
  return handleGenerate(req);
}

async function handleGenerate(req: NextRequest) {
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const isManualTrigger =
    req.headers.get("x-api-secret") === process.env.CRON_SECRET;
  const isChainCall =
    req.headers.get("x-chain-secret") === process.env.CRON_SECRET;

  if (!isVercelCron && !isManualTrigger && !isChainCall) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const regionParam = req.nextUrl.searchParams.get("region");
  const regionToRun = regionParam && REGIONS[regionParam] ? regionParam : "global";

  try {
    let headlines;
    let hnSignals = null;

    if (regionToRun === "global") {
      // Global: mix NewsAPI + RSS feeds + HackerNews
      const [newsApi, rssFeed, hn] = await Promise.all([
        fetchTopTechHeadlines().catch(() => []),
        fetchGlobalHeadlines().catch(() => []),
        fetchHNSignals().catch(() => null),
      ]);
      hnSignals = hn;
      const hnHeadlines = hn ? getHNAsHeadlines(hn) : [];
      headlines = [...hnHeadlines, ...rssFeed, ...newsApi];
    } else {
      // Regional: use REAL regional publications via RSS
      // Fall back to NewsAPI only if RSS returns nothing
      const [rssHeadlines, newsApiFallback] = await Promise.all([
        fetchRegionalHeadlines(regionToRun).catch(() => []),
        fetchTopTechHeadlines(regionToRun).catch(() => []),
      ]);
      headlines = rssHeadlines.length > 0 ? rssHeadlines : newsApiFallback;
    }

    // Build cross-signal context
    const crossSignalBrief = hnSignals
      ? `\n\nCROSS-SIGNAL INTELLIGENCE:\n${formatHNContext(hnSignals)}`
      : "";

    const activeSources: string[] = ["News"];
    if (hnSignals) activeSources.push("HackerNews");

    const regionLabel = REGIONS[regionToRun]?.label ?? "Global";
    const results: { slug: string; headline: string; status: string }[] = [];
    let created = 0;

    for (const news of headlines) {
      if (created >= 1) break;

      const slug = slugify(news.title);

      const { data: existing } = await supabaseAdmin
        .from("articles")
        .select("id")
        .eq("slug", slug)
        .single();

      if (existing) {
        results.push({ slug, headline: news.title, status: "skipped" });
        continue;
      }

      try {
        let userContent = `Write a deep analytical article about this tech story:\n\nHeadline: ${news.title}\nDescription: ${news.description ?? "No description available."}\nSource: ${news.source.name}\nURL: ${news.url}\nRegion: ${regionLabel}`;

        if (regionToRun !== "global") {
          userContent += `\n\nIMPORTANT: This story is from ${news.source.name}, a ${regionLabel} publication. Write your analysis from within this region's perspective. Don't treat it as an outsider looking in. Understand the local market dynamics, the key players in this region, and why this story matters to people living and building here.`;
        }

        userContent += crossSignalBrief;

        const message = await getAnthropicClient().messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 3000,
          system: ARTICLE_SYSTEM_PROMPT,
          messages: [{ role: "user", content: userContent }],
        });

        let text =
          message.content[0].type === "text" ? message.content[0].text : "";
        text = text
          .replace(/^```(?:json)?\s*\n?/i, "")
          .replace(/\n?```\s*$/, "")
          .trim();
        const article = JSON.parse(text);

        if (article.skip) {
          results.push({ slug, headline: news.title, status: `skipped: ${article.reason}` });
          continue;
        }

        const { error } = await supabaseAdmin.from("articles").insert({
          slug,
          headline: article.headline,
          subheadline: article.subheadline,
          category: article.category,
          region: regionToRun,
          what_happened: article.what_happened,
          why_it_matters: article.why_it_matters,
          who_wins_loses: article.who_wins_loses,
          what_to_watch: article.what_to_watch,
          full_body: article.full_body,
          source_urls: [news.url],
          source_headlines: [news.title],
          signal_score: parseInt(article.signal_score) || 50,
          signal_sources: activeSources,
          social_context: article.social_pulse ?? null,
        });

        if (error) {
          results.push({ slug, headline: news.title, status: `db_error: ${error.message}` });
        } else {
          created++;
          results.push({ slug, headline: article.headline, status: "created" });
        }
      } catch (err) {
        results.push({
          slug,
          headline: news.title,
          status: `error: ${err instanceof Error ? err.message : "unknown"}`,
        });
      }
    }

    // Chain next region
    const currentIdx = REGION_CHAIN.indexOf(regionToRun);
    const nextIdx = currentIdx + 1;
    if (nextIdx < REGION_CHAIN.length) {
      const nextRegion = REGION_CHAIN[nextIdx];
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? "https://vantage-three-chi.vercel.app";
      fetch(`${siteUrl}/api/generate-articles?region=${nextRegion}`, {
        method: "POST",
        headers: { "x-chain-secret": process.env.CRON_SECRET ?? "" },
      }).catch(() => {});
    }

    return NextResponse.json({
      region: regionToRun,
      created,
      skipped: results.filter((r) => r.status === "skipped").length,
      signals: activeSources,
      results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pipeline failed" },
      { status: 500 }
    );
  }
}
