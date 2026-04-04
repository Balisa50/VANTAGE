import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { slugify, REGIONS } from "../../lib/newsapi";
import { fetchRegionalHeadlines } from "../../lib/feeds";

export const runtime = "edge";

const REGION_CHAIN = ["global", "africa", "asia", "europe", "americas", "middleeast"];

const PIPELINE_PROMPT = `You are the most dangerous editorial mind in technology journalism. You combine the analytical precision of Ben Thompson, the financial fluency of Matt Levine, the geopolitical instinct of The Economist, and the irreverence of someone who has built and broken companies firsthand.

You are not a summarizer. You are a strategist who writes. Every article must contain at least one insight the reader cannot get anywhere else.

RULES:
- EVERY HEADLINE IS A VERDICT. Must contain a thesis or provocation.
- Start with a number that shocks or a counterintuitive statement. NEVER "In a move that..."
- FOLLOW THE MONEY. "$4.2 billion" not "billions."
- NAME NAMES. CITE NUMBERS. Be specific.
- NEVER use em dashes or en dashes. Use commas, semicolons, colons, periods.
- Zero filler. Never "it's worth noting" or "interestingly."
- Short paragraphs. 2-3 sentences max.
- End with specific, falsifiable predictions.

If NOT tech/business/policy: {"skip":true,"reason":"Not a tech story"}

Return ONLY raw JSON:
{"headline":"A verdict with thesis","subheadline":"One sharp sentence","category":"AI|Infrastructure|Startups|Big Tech|Policy|Markets","what_happened":"2-3 paragraphs. Names, numbers, dates.","why_it_matters":"3-4 paragraphs. Strong position. Second-order effects.","who_wins_loses":"2-3 paragraphs. Name companies, executives, countries.","what_to_watch":"1-2 paragraphs. Specific predictions with dates.","social_pulse":"1 paragraph or null","full_body":"Complete article, 800+ words. Publication-ready. Hook opening. Every paragraph earns the next.","signal_score":"1-100"}`;

// Direct Anthropic API call — no SDK needed, works in Edge Runtime
async function callClaude(systemPrompt: string, userContent: string): Promise<string> {
  const apiKey = process.env.VANTAGE_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.type === "text" ? data.content[0].text : "";
}

// Fetch global headlines via NewsAPI — direct fetch for edge compatibility
async function fetchGlobalHeadlines(): Promise<{ title: string; description: string | null; url: string; source: { name: string } }[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  const QUERY_SETS = [
    "artificial intelligence OR OpenAI OR Anthropic OR Google AI",
    "startup funding OR Series A OR unicorn OR IPO tech",
    "cybersecurity breach OR ransomware OR zero-day",
    "cloud computing OR AWS OR Azure OR Google Cloud",
    "NVIDIA OR TSMC OR semiconductor OR AI chip",
    "tech regulation OR antitrust OR EU digital OR AI safety",
    "fintech OR digital payments OR crypto regulation",
    "developer tools OR open source OR GitHub OR API platform",
  ];

  const queryIdx = new Date().getUTCHours() % QUERY_SETS.length;
  const query = QUERY_SETS[queryIdx];
  const from = new Date(Date.now() - 48 * 3600 * 1000).toISOString().split("T")[0];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${from}&sortBy=relevancy&pageSize=10&language=en&apiKey=${apiKey}`,
      { signal: controller.signal, cache: "no-store" }
    );
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles ?? []).filter((a: { title: string }) => a.title && a.title.length > 10);
  } catch {
    return [];
  }
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  return handleGenerate(req);
}

export async function POST(req: NextRequest) {
  return handleGenerate(req);
}

async function handleGenerate(req: NextRequest) {
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const isManualTrigger = req.headers.get("x-api-secret") === process.env.CRON_SECRET;
  const isChainCall = req.headers.get("x-chain-secret") === process.env.CRON_SECRET;

  if (!isVercelCron && !isManualTrigger && !isChainCall) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const regionParam = req.nextUrl.searchParams.get("region");
  const regionToRun = regionParam && REGIONS[regionParam] ? regionParam : "global";

  try {
    let headlines;

    if (regionToRun === "global") {
      headlines = await fetchGlobalHeadlines();
    } else {
      const rssHeadlines = await fetchRegionalHeadlines(regionToRun).catch(() => []);
      headlines = rssHeadlines.length > 0 ? rssHeadlines : await fetchGlobalHeadlines();
    }

    const regionLabel = REGIONS[regionToRun]?.label ?? "Global";
    const results: { slug: string; headline: string; status: string }[] = [];
    let created = 0;
    const db = getSupabaseAdmin();

    for (const news of headlines) {
      if (created >= 1) break;

      const slug = slugify(news.title);

      const { data: existing } = await db
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

        const text = await callClaude(PIPELINE_PROMPT, userContent);
        const cleaned = text
          .replace(/^```(?:json)?\s*\n?/i, "")
          .replace(/\n?```\s*$/, "")
          .trim();
        const article = JSON.parse(cleaned);

        if (article.skip) {
          results.push({ slug, headline: news.title, status: `skipped: ${article.reason}` });
          continue;
        }

        const { error } = await db.from("articles").insert({
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

    // Chain next region
    const currentIdx = REGION_CHAIN.indexOf(regionToRun);
    const nextIdx = currentIdx + 1;
    if (nextIdx < REGION_CHAIN.length) {
      const nextRegion = REGION_CHAIN[nextIdx];
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vantage-three-chi.vercel.app";
      fetch(`${siteUrl}/api/generate-articles?region=${nextRegion}`, {
        method: "POST",
        headers: { "x-chain-secret": process.env.CRON_SECRET ?? "" },
      }).catch(() => {});
    }

    return NextResponse.json({ region: regionToRun, created, results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pipeline failed" },
      { status: 500 }
    );
  }
}
