import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, ARTICLE_SYSTEM_PROMPT } from "../../lib/anthropic";
import { supabaseAdmin } from "../../lib/supabase";
import { fetchTopTechHeadlines, slugify, REGIONS } from "../../lib/newsapi";
import { fetchHNSignals, getHNAsHeadlines } from "../../lib/hackernews";

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
    // For global region, also pull HackerNews top stories as article candidates
    let headlines = await fetchTopTechHeadlines(
      regionToRun === "global" ? undefined : regionToRun
    );

    if (regionToRun === "global") {
      try {
        const hnSignals = await fetchHNSignals();
        if (hnSignals) {
          const hnHeadlines = getHNAsHeadlines(hnSignals);
          headlines = [...hnHeadlines, ...headlines];
        }
      } catch {
        // HN fetch failed, continue with news headlines only
      }
    }

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

        const message = await getAnthropicClient().messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
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
          signal_sources: ["News"],
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

    // CHAIN: trigger the next region automatically (fire-and-forget)
    const currentIdx = REGION_CHAIN.indexOf(regionToRun);
    const nextIdx = currentIdx + 1;
    if (nextIdx < REGION_CHAIN.length) {
      const nextRegion = REGION_CHAIN[nextIdx];
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? "https://vantage-three-chi.vercel.app";
      // Fire and forget — don't await, don't block response
      fetch(`${siteUrl}/api/generate-articles?region=${nextRegion}`, {
        method: "POST",
        headers: { "x-chain-secret": process.env.CRON_SECRET ?? "" },
      }).catch(() => {});
    }

    return NextResponse.json({
      region: regionToRun,
      created,
      skipped: results.filter((r) => r.status === "skipped").length,
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
