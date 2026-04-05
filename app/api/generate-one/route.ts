import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

// Compact but sharp prompt — optimized for Vercel edge timeout
// Full supernatural prompt is used in scripts/generate-local.mjs
const PIPELINE_PROMPT = `Sharp tech analyst. Write like Ben Thompson + Matt Levine + The Economist. Take positions. Follow the money. Name names, cite exact numbers. Headlines are verdicts. No em dashes. No filler. Short paragraphs.

If NOT tech/business/policy: {"skip":true,"reason":"..."}

Return ONLY raw JSON:
{"headline":"Verdict with thesis","subheadline":"One sharp sentence","category":"AI|Infrastructure|Startups|Big Tech|Policy|Markets","what_happened":"2 paragraphs. Facts, names, numbers.","why_it_matters":"2 paragraphs. Take position. Second-order effects.","who_wins_loses":"1 paragraph. Name companies, countries.","what_to_watch":"1 paragraph. Specific predictions.","social_pulse":"2-3 sentences. What are engineers, founders, and the tech community actually saying? What does their reaction reveal about the story's real significance? Synthesize sentiment, not quotes.","full_body":"300-400 word article. Sharp. No filler. Hook opening. Keep it tight so the JSON completes within token limits.","signal_score":"1-100"}`;

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Minimal endpoint: receive headline data, call Claude, insert.
// No RSS fetching — that's done by the trigger.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-chain-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description, source, region, regionLabel } = await req.json();
    if (!title) return NextResponse.json({ error: "Missing title" }, { status: 400 });

    const slug = slugify(title);
    const db = getDb();

    // Check duplicate by slug
    const { data: existing } = await db.from("articles").select("id").eq("slug", slug).single();
    if (existing) return NextResponse.json({ status: "skipped", slug });

    // Check duplicate by similar headline (first 3 significant words)
    const words = title.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w: string) => w.length > 3).slice(0, 3);
    if (words.length >= 2) {
      const { data: similar } = await db.from("articles").select("id")
        .ilike("headline", `%${words[0]}%`)
        .ilike("headline", `%${words[1]}%`)
        .limit(1);
      if (similar && similar.length > 0) return NextResponse.json({ status: "skipped", reason: "similar exists" });
    }

    // Call Claude
    const apiKey = process.env.VANTAGE_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    let userContent = `Headline: ${title}\nDescription: ${description || "No description."}\nSource: ${source || "Unknown"}\nRegion: ${regionLabel || "Global"}`;
    if (region && region !== "global") {
      userContent += `\n\nWrite from inside ${regionLabel}. Local perspective, local dynamics.`;
    }

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: PIPELINE_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!claudeRes.ok) throw new Error(`Claude API: ${claudeRes.status}`);
    const data = await claudeRes.json();
    const text = data.content?.[0]?.text || "";

    let cleaned = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "").trim();

    // Repair truncated JSON: if it doesn't end with }, try to close it
    if (!cleaned.endsWith("}")) {
      // Find the last complete key-value pair
      const lastQuote = cleaned.lastIndexOf('"');
      const lastColon = cleaned.lastIndexOf('":');
      if (lastColon > 0 && lastColon > cleaned.lastIndexOf('"}')) {
        // Truncated mid-value — close the string and object
        cleaned = cleaned.slice(0, lastColon) + '":"truncated"}';
      } else if (lastQuote > 0) {
        cleaned = cleaned.slice(0, lastQuote + 1) + "}";
      } else {
        cleaned += '"}';
      }
    }

    const article = JSON.parse(cleaned);

    if (article.skip) return NextResponse.json({ status: "skipped", reason: article.reason });

    // If full_body is missing or truncated, build from sections
    let fullBody = article.full_body || "";
    if (!fullBody || fullBody === "truncated" || fullBody.length < 100) {
      const parts = [article.what_happened, article.why_it_matters, article.who_wins_loses, article.what_to_watch, article.social_pulse].filter(Boolean);
      fullBody = parts.join("\n\n");
    }

    const { error } = await db.from("articles").insert({
      slug,
      headline: article.headline,
      subheadline: article.subheadline,
      category: article.category,
      region: region || "global",
      what_happened: article.what_happened,
      why_it_matters: article.why_it_matters,
      who_wins_loses: article.who_wins_loses,
      what_to_watch: article.what_to_watch,
      full_body: fullBody,
      source_urls: [],
      source_headlines: [title],
      signal_score: parseInt(article.signal_score) || 50,
      signal_sources: ["News"],
      social_context: article.social_pulse || null,
    });

    if (error) return NextResponse.json({ status: "db_error", message: error.message });
    return NextResponse.json({ status: "created", headline: article.headline, slug });

  } catch (err) {
    return NextResponse.json(
      { status: "error", message: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
