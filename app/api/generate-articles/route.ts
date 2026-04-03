import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "../../lib/anthropic";
import { supabaseAdmin } from "../../lib/supabase";
import { fetchTopTechHeadlines, slugify, REGIONS } from "../../lib/newsapi";
import { fetchRegionalHeadlines } from "../../lib/feeds";

export const maxDuration = 60;

const REGION_CHAIN = ["global", "africa", "asia", "europe", "americas", "middleeast"];

// Lean prompt for pipeline speed — keeps quality high but fits in 60s
const PIPELINE_PROMPT = `You are the editorial engine behind Vantage, the world's sharpest tech publication. Write like Ben Thompson meets Matt Levine meets The Economist. Take positions. Follow the money. Name names and numbers. Be specific.

If NOT a tech/business/policy story: {"skip": true, "reason": "Not a tech story"}

Return ONLY raw JSON:
{
  "headline": "A verdict, not a description. Must contain a thesis.",
  "subheadline": "One sharp sentence deepening the headline.",
  "category": "One of: AI, Infrastructure, Startups, Big Tech, Policy, Markets",
  "what_happened": "2-3 paragraphs. Specific names, numbers, dates.",
  "why_it_matters": "3-4 paragraphs. Take a position. Second-order effects. Connect to larger narrative.",
  "who_wins_loses": "2-3 paragraphs. Name specific companies, people, countries.",
  "what_to_watch": "1-2 paragraphs. Specific dates, deadlines, predictions.",
  "social_pulse": "1 paragraph or 'No significant community signal detected.'",
  "full_body": "Complete article, minimum 800 words. Publication-ready prose. Hook opening. Strong argument. Every paragraph earns the next.",
  "signal_score": "Integer 1-100. Be honest."
}`;

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

    if (regionToRun === "global") {
      headlines = await fetchTopTechHeadlines().catch(() => []);
    } else {
      const rssHeadlines = await fetchRegionalHeadlines(regionToRun).catch(() => []);
      headlines = rssHeadlines.length > 0
        ? rssHeadlines
        : await fetchTopTechHeadlines(regionToRun).catch(() => []);
    }

    const activeSources: string[] = ["News"];
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
        let userContent = `Headline: ${news.title}\nDescription: ${news.description ?? "No description."}\nSource: ${news.source.name}\nRegion: ${regionLabel}`;

        if (regionToRun !== "global") {
          userContent += `\n\nWrite from inside ${regionLabel}. Local perspective, local dynamics.`;
        }

        const message = await getAnthropicClient().messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2500,
          system: PIPELINE_PROMPT,
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
      results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pipeline failed" },
      { status: 500 }
    );
  }
}
