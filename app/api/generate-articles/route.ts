import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, ARTICLE_SYSTEM_PROMPT } from "../../lib/anthropic";
import { supabaseAdmin } from "../../lib/supabase";
import { fetchTopTechHeadlines, slugify, REGIONS } from "../../lib/newsapi";
import { fetchHNSignals, getHNAsHeadlines, formatHNContext } from "../../lib/hackernews";
import { fetchVirloSignals, formatVirloContext } from "../../lib/virlo";

export const maxDuration = 60;

const REGION_CHAIN = ["global", "africa", "asia", "europe", "americas", "middleeast"];
const ARTICLES_PER_REGION = 2;

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
    // Fetch all signal sources in parallel
    const [newsHeadlines, hnSignals, virloSignals] = await Promise.all([
      fetchTopTechHeadlines(regionToRun === "global" ? undefined : regionToRun),
      regionToRun === "global" ? fetchHNSignals().catch(() => null) : Promise.resolve(null),
      fetchVirloSignals().catch(() => null),
    ]);

    let headlines = newsHeadlines;

    // Merge HN top stories as article candidates for global
    if (regionToRun === "global" && hnSignals) {
      const hnHeadlines = getHNAsHeadlines(hnSignals);
      headlines = [...hnHeadlines, ...headlines];
    }

    // Build cross-signal context to enrich every article
    const signalContext: string[] = [];
    if (hnSignals) signalContext.push(formatHNContext(hnSignals));
    if (virloSignals) signalContext.push(formatVirloContext(virloSignals));
    const crossSignalBrief = signalContext.length > 0
      ? `\n\nCROSS-SIGNAL INTELLIGENCE:\n${signalContext.join("\n\n")}`
      : "";

    // Determine which signal sources are active
    const activeSources: string[] = ["News"];
    if (hnSignals) activeSources.push("HackerNews");
    if (virloSignals) activeSources.push("Virlo");

    const regionLabel = REGIONS[regionToRun]?.label ?? "Global";
    const results: { slug: string; headline: string; status: string }[] = [];
    let created = 0;

    for (const news of headlines) {
      if (created >= ARTICLES_PER_REGION) break;

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
        let userContent = `Write an analytical article about this tech story:\n\nHeadline: ${news.title}\nDescription: ${news.description ?? "No description available."}\nSource: ${news.source.name}\nURL: ${news.url}\nRegion: ${regionLabel}`;

        if (regionToRun !== "global") {
          userContent += `\n\nThis story comes from the ${regionLabel} tech ecosystem. Frame your analysis with awareness of this region's specific tech landscape, regulatory environment, and market dynamics.`;
        }

        // Append cross-signal intelligence
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

    // CHAIN: trigger the next region automatically
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
      nextRegion: nextIdx < REGION_CHAIN.length ? REGION_CHAIN[nextIdx] : null,
      results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pipeline failed" },
      { status: 500 }
    );
  }
}
