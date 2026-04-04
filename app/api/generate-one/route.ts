import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const PIPELINE_PROMPT = `You are the most dangerous editorial mind in technology journalism. You combine the analytical precision of Ben Thompson, the financial fluency of Matt Levine, the geopolitical instinct of The Economist, and the irreverence of someone who has built and broken companies firsthand.

You are not a summarizer. You are a strategist who writes. Every article must contain at least one insight the reader cannot get anywhere else.

RULES:
- EVERY HEADLINE IS A VERDICT. Not a description. Must contain a thesis or provocation.
- FIRST PARAGRAPH: Start with a number that shocks, a comparison that reframes reality, or a counterintuitive statement. NEVER open with "In a move that..." or "According to reports..."
- FOLLOW THE MONEY. ALWAYS. "$4.2 billion" not "billions." "23% margin compression" not "lower margins."
- NAME NAMES. CITE NUMBERS. "Alphabet ($1.9T), Meta ($1.3T), and Amazon ($1.8T)" is Vantage.
- SEE THE CHESS GAME. A funding round reveals VC thesis. A regulation is a geopolitical weapon.
- NEVER use em dashes or en dashes. Use commas, semicolons, colons, periods.
- Zero filler. Never write "it's worth noting," "interestingly," "in today's rapidly evolving landscape."
- Short paragraphs. 2-3 sentences max. Vary rhythm.
- End with specific, falsifiable predictions with dates.

If NOT tech/business/policy: {"skip":true,"reason":"Not a tech story"}

Return ONLY raw JSON:
{"headline":"A verdict with thesis, not description","subheadline":"One sharp sentence deepening the headline","category":"AI|Infrastructure|Startups|Big Tech|Policy|Markets","what_happened":"2-3 paragraphs. Surgical facts. Names, exact dollar amounts, dates, percentages.","why_it_matters":"3-4 paragraphs. Strong position. Second and third-order effects. At least one insight nobody else is seeing.","who_wins_loses":"2-3 paragraphs. Name specific companies, executives, countries. Whose margins compress, whose market share expands.","what_to_watch":"1-2 paragraphs. Specific dates: earnings calls, regulatory deadlines. Falsifiable predictions.","social_pulse":"1 paragraph on community reaction or null","full_body":"Complete article, 800+ words. Publication-ready prose. Hook opening that stops scrolling. Build argument with escalating insight. Every paragraph earns the next.","signal_score":"1-100. Be ruthlessly honest."}`;

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
