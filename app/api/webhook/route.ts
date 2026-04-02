import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, ARTICLE_SYSTEM_PROMPT } from "../../lib/anthropic";
import { supabaseAdmin } from "../../lib/supabase";
import { slugify } from "../../lib/newsapi";

export const maxDuration = 60;

/**
 * On-demand article generation webhook.
 * POST /api/webhook
 * Headers: x-api-secret: <CRON_SECRET>
 * Body: { "headline": "...", "description": "...", "url": "...", "source": "...", "region": "global" }
 *
 * Use this to generate articles in real-time when big news breaks.
 * Can be triggered via Zapier, IFTTT, curl, or any HTTP client.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-api-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const headline = body.headline?.trim();
    const description = body.description?.trim() || "No description available.";
    const url = body.url?.trim() || "";
    const source = body.source?.trim() || "Manual";
    const region = body.region?.trim() || "global";

    if (!headline) {
      return NextResponse.json(
        { error: "headline is required" },
        { status: 400 }
      );
    }

    const slug = slugify(headline);

    // Check for duplicate
    const { data: existing } = await supabaseAdmin
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { status: "skipped", reason: "Article with this slug already exists", slug },
        { status: 200 }
      );
    }

    const userContent = `Write an analytical article about this breaking tech story:\n\nHeadline: ${headline}\nDescription: ${description}\nSource: ${source}${url ? `\nURL: ${url}` : ""}\nRegion: ${region}\n\nThis is a breaking story. Prioritize speed and sharp analysis. Make a call on why this matters right now.`;

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
      region,
      what_happened: article.what_happened,
      why_it_matters: article.why_it_matters,
      who_wins_loses: article.who_wins_loses,
      what_to_watch: article.what_to_watch,
      full_body: article.full_body,
      source_urls: url ? [url] : [],
      source_headlines: [headline],
      signal_score: parseInt(article.signal_score) || 50,
      signal_sources: ["Breaking"],
      social_context: article.social_pulse ?? null,
    });

    if (error) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "created",
      slug,
      headline: article.headline,
      url: `/article/${slug}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
