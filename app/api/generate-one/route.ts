import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const PIPELINE_PROMPT = `You are the editorial engine behind Vantage. Write like Ben Thompson meets Matt Levine meets The Economist. Take positions. Follow the money. Name names and cite numbers. Be specific.

CRITICAL: NEVER use em dashes or en dashes. Use commas, semicolons, colons, periods instead.
Never open with "In a move that..." or filler like "it's worth noting."

If NOT tech/business/policy: {"skip":true,"reason":"Not a tech story"}

Return ONLY raw JSON:
{"headline":"A verdict with thesis","subheadline":"One sharp sentence","category":"AI|Infrastructure|Startups|Big Tech|Policy|Markets","what_happened":"1-2 short paragraphs. Names, numbers, dates.","why_it_matters":"2 paragraphs. Take position. Second-order effects.","who_wins_loses":"1 paragraph. Name companies, people, countries.","what_to_watch":"1 short paragraph. Specific predictions.","social_pulse":"1 sentence or null","full_body":"400-500 word article. Concise. Publication-ready. Hook opening. MUST complete the JSON.","signal_score":"1-100"}`;

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

    // Check duplicate
    const { data: existing } = await db.from("articles").select("id").eq("slug", slug).single();
    if (existing) return NextResponse.json({ status: "skipped", slug });

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
        max_tokens: 2500,
        system: PIPELINE_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!claudeRes.ok) throw new Error(`Claude API: ${claudeRes.status}`);
    const data = await claudeRes.json();
    const text = data.content?.[0]?.text || "";

    const cleaned = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "").trim();
    const article = JSON.parse(cleaned);

    if (article.skip) return NextResponse.json({ status: "skipped", reason: article.reason });

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
      full_body: article.full_body,
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
