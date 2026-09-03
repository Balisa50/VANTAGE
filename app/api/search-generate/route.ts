import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ARTICLE_SYSTEM_PROMPT } from "../../lib/anthropic";
import { nvidiaChat } from "../../lib/nvidia";
import { slugify } from "../../lib/newsapi";
import {
  GLOBAL_PER_DAY,
  ipIsOverLimit,
  localGlobalIsOverLimit,
  onDemandCountLast24h,
} from "../../lib/rate-limit";

export const runtime = "edge";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

async function callClaude(systemPrompt: string, userContent: string): Promise<string> {
  return nvidiaChat({
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
    maxTokens: 3000,
  });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (ipIsOverLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit reached. Try again in an hour." },
      { status: 429 }
    );
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

    // The global cap is checked here, after the lookup rather than before it.
    // Returning an article that already exists costs nothing, so being over
    // the daily generation limit is no reason to refuse one. Only the branch
    // below spends anything.
    const generatedToday = await onDemandCountLast24h(db);
    const overGlobalLimit =
      generatedToday === null
        ? localGlobalIsOverLimit()
        : generatedToday >= GLOBAL_PER_DAY;

    if (overGlobalLimit) {
      return NextResponse.json(
        { error: "Daily generation limit reached. Try again tomorrow." },
        { status: 429 }
      );
    }

    // Generate an analysis on the spot
    const text = await callClaude(
      ARTICLE_SYSTEM_PROMPT,
      `The user is searching for: "${searchTerm}"

Write a deep analytical article about this topic. Research this from your knowledge - what are the latest developments, the key players, the strategic implications? Write as if this just broke today.

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
