import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, ARTICLE_SYSTEM_PROMPT } from "../../lib/anthropic";
import { supabaseAdmin } from "../../lib/supabase";
import { slugify } from "../../lib/newsapi";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 3) {
      return NextResponse.json({ error: "Query too short" }, { status: 400 });
    }

    const searchTerm = query.trim();

    // First: try one more search in case we missed something
    const { data: existing } = await supabaseAdmin
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
    const message = await getAnthropicClient().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: ARTICLE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `The user is searching for: "${searchTerm}"

Write a deep analytical article about this topic. Research this from your knowledge — what are the latest developments, the key players, the strategic implications? Write as if this just broke today.

If this is clearly not a tech/policy/markets story, still analyze it through a technology or strategic lens. Find the tech angle. There is always one.`,
        },
      ],
    });

    let text =
      message.content[0].type === "text" ? message.content[0].text : "";
    text = text
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/, "")
      .trim();

    const article = JSON.parse(text);

    if (article.skip) {
      return NextResponse.json(
        { error: "Could not generate analysis" },
        { status: 404 }
      );
    }

    const slug = slugify(article.headline);

    const { data: inserted, error } = await supabaseAdmin
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
