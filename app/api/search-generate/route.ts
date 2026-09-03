import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ARTICLE_SYSTEM_PROMPT } from "../../lib/anthropic";
import { nvidiaChat } from "../../lib/nvidia";
import { slugify } from "../../lib/newsapi";
import { extractJsonObject } from "../../lib/json-extract";
import {
  GLOBAL_PER_DAY,
  ipIsOverLimit,
  localGlobalIsOverLimit,
  onDemandCountLast24h,
} from "../../lib/rate-limit";

// Node rather than edge. The edge runtime stops a request at 25 seconds, and
// this route asks the model for a full analytical article, which does not
// reliably finish in that window: every on-demand generation was returning
// FUNCTION_INVOCATION_TIMEOUT. Node functions can be given a longer duration.
export const runtime = "nodejs";
export const maxDuration = 60;

// The model gets less than the function does, so a slow answer comes back as
// an error this route wrote rather than a gateway timeout with no body.
//
// The per-call figure is deliberately most of the budget rather than a third
// of it. Under a hard 60s ceiling, three models with 13 seconds each all fail;
// one model with 38 seconds can actually answer. The chain is there for a
// model being retired or down, which is a fast failure, not for a slow one.
const MODEL_DEADLINE_MS = 46_000;
const MODEL_PER_CALL_MS = 40_000;

// KNOWN LIMITATION, measured rather than assumed.
//
// The only model still alive on the free endpoint is a reasoning model, and
// its latency for this article schema is not stable: 1200 tokens returned in
// 19s on one call, 1800 tokens did not finish in 36s on another. 1200 is small
// enough to be reliably fast and small enough to truncate mid-article; 2500
// did not return inside the function ceiling at all.
//
// 1500 is the compromise. It succeeds when the model is having a good minute
// and returns a 503 the caller can render when it is not. That is as far as
// tuning goes: making this dependable needs either a faster model in the chain
// above, or generating in the background and having the client poll, which is
// the right shape for work that cannot promise to finish inside one request.

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

async function callModel(systemPrompt: string, userContent: string): Promise<string> {
  return nvidiaChat({
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
    // Sized from measurement. 1200 tokens returned in 19s but was truncated
    // mid-subheadline; 2500 did not come back inside the function ceiling at
    // all, because the model time is only part of the 60s: the cache lookup,
    // the cap query and the insert all sit inside it too.
    //
    // 1800 is the largest that has room to finish and still leave the deadline
    // to expire before the platform does. On-demand articles are shorter than
    // the ones the daily pipeline writes, which has a longer window to work in.
    maxTokens: 1500,
    timeoutMs: MODEL_PER_CALL_MS,
    deadlineMs: MODEL_DEADLINE_MS,
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
    let text: string;
    try {
      text = await callModel(
      ARTICLE_SYSTEM_PROMPT,
      `The user is searching for: "${searchTerm}"

Write a deep analytical article about this topic. Research this from your knowledge - what are the latest developments, the key players, the strategic implications? Write as if this just broke today.

If this is clearly not a tech/policy/markets story, still analyze it through a technology or strategic lens. Find the tech angle. There is always one.`
      );
    } catch (err) {
      // The model ran out of budget or the chain failed. Say so, with a status
      // the client can branch on, instead of letting the platform return an
      // empty 504.
      return NextResponse.json(
        {
          error:
            "Could not generate an analysis in time. Try a narrower search, or try again shortly.",
          detail: err instanceof Error ? err.message : String(err),
        },
        { status: 503 }
      );
    }

    let article: Record<string, string>;
    try {
      article = extractJsonObject<Record<string, string>>(text);
    } catch (err) {
      // The request succeeded and the model said something; it just was not
      // an article. That is a different failure from a timeout and gets its
      // own status so the client can tell them apart.
      return NextResponse.json(
        {
          error: "The model did not return a usable article. Try again.",
          detail: err instanceof Error ? err.message : String(err),
        },
        { status: 502 }
      );
    }

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
