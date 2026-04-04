import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ARTICLE_SYSTEM_PROMPT } from "../../lib/anthropic";
import { slugify } from "../../lib/newsapi";

export const runtime = "edge";

// Rate limit: 3 on-demand generations per IP per hour, 30 per day globally
const rateMap = new Map<string, { count: number; resetAt: number }>();
let dailyCount = 0;
let dailyReset = Date.now() + 86_400_000;

function isLimited(ip: string): boolean {
  const now = Date.now();
  if (now > dailyReset) { dailyCount = 0; dailyReset = now + 86_400_000; }
  if (dailyCount >= 30) return true;

  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 3_600_000 });
    dailyCount++;
    return false;
  }
  entry.count++;
  if (entry.count > 3) return true;
  dailyCount++;
  return false;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

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
      max_tokens: 3000,
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

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isLimited(ip)) {
    return NextResponse.json({ error: "Rate limit reached. Try again later." }, { status: 429 });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 3) {
      return NextResponse.json({ error: "Query too short" }, { status: 400 });
    }

    const searchTerm = query.trim();
    const db = getSupabaseAdmin();

    // First: try one more search in case we missed something
    const { data: existing } = await db
      .from("articles")
      .select("*")
      .or(
        `headline.ilike.%${searchTerm}%,subheadline.ilike.%${searchTerm}%,full_body.ilike.%${searchTerm}%`
      )
      .order("published_at", { ascending: false })
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ article: existing[0] });
    }

    // Generate an analysis on the spot
    const text = await callClaude(
      ARTICLE_SYSTEM_PROMPT,
      `The user is searching for: "${searchTerm}"

Write a deep analytical article about this topic. Research this from your knowledge — what are the latest developments, the key players, the strategic implications? Write as if this just broke today.

If this is clearly not a tech/policy/markets story, still analyze it through a technology or strategic lens. Find the tech angle. There is always one.`
    );

    const cleaned = text
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/, "")
      .trim();

    const article = JSON.parse(cleaned);

    if (article.skip) {
      return NextResponse.json(
        { error: "Could not generate analysis" },
        { status: 404 }
      );
    }

    const slug = slugify(article.headline);

    const { data: inserted, error } = await db
      .from("articles")
      .insert({
        slug,
        headline: article.headline,
        subheadline: article.subheadline,
        category: article.category,
        region: "global",
        what_happened: article.what_happened,
        why_it_matters: article.why_it_matters,
        who_wins_loses: article.who_wins_loses,
        what_to_watch: article.what_to_watch,
        full_body: article.full_body,
        source_urls: [],
        source_headlines: [searchTerm],
        signal_score: parseInt(article.signal_score) || 50,
        signal_sources: ["On-Demand"],
        social_context: article.social_pulse ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ article: inserted });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
