#!/usr/bin/env node
// Generate extra articles for thin regions
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

function loadEnv() {
  try {
    const dir = dirname(fileURLToPath(import.meta.url));
    const envFile = readFileSync(resolve(dir, "../.env.local"), "utf-8");
    for (const line of envFile.split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.+)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim();
      }
    }
  } catch { /* .env.local not found */ }
}
loadEnv();

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ANTHROPIC_KEY = process.env.VANTAGE_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;

const PROMPT = `You are the editorial engine behind Vantage. Write like Ben Thompson meets Matt Levine meets The Economist. Take positions. Follow the money. Name names and cite numbers. Be specific.

CRITICAL: NEVER use em dashes or en dashes. Use commas, semicolons, colons, periods instead.
Never open with "In a move that..." or filler like "it's worth noting."

If NOT tech/business/policy: {"skip":true,"reason":"Not a tech story"}

Return ONLY raw JSON:
{"headline":"A verdict with thesis","subheadline":"One sharp sentence","category":"AI|Infrastructure|Startups|Big Tech|Policy|Markets","what_happened":"2 paragraphs. Names, numbers, dates.","why_it_matters":"2-3 paragraphs. Strong position. Second-order effects.","who_wins_loses":"1-2 paragraphs. Name companies, people, countries.","what_to_watch":"1 paragraph. Specific predictions.","social_pulse":"1 short paragraph or null","full_body":"Complete article, 500-600 words. Publication-ready. Concise.","signal_score":"1-100"}`;

function slugify(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80); }

async function callClaude(content) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 2500, system: PROMPT, messages: [{ role: "user", content }] }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const d = await res.json();
  return d.content?.[0]?.text || "";
}

// Extra stories to fill thin regions
const STORIES = [
  { region: "middleeast", title: "Saudi Arabia's NEOM tech city signs $1B AI infrastructure deal with Oracle", desc: "NEOM partners with Oracle to build AI-powered smart city infrastructure in the $500B megaproject", source: "Arabian Business" },
  { region: "middleeast", title: "UAE's G42 and Microsoft expand $1.5B AI partnership to healthcare", desc: "Abu Dhabi AI firm G42 deploys Azure-powered diagnostic tools across Gulf hospitals", source: "Gulf News" },
  { region: "europe", title: "EU AI Act enforcement begins as first compliance deadlines hit companies", desc: "Companies face fines up to 7% of global revenue for non-compliance with risk-based AI regulation", source: "Sifted" },
  { region: "global", title: "Google DeepMind unveils Gemini 2.5 Pro with 1M token context window", desc: "Latest model doubles context length and introduces native tool use, challenging OpenAI's GPT-5 roadmap", source: "The Verge" },
  { region: "global", title: "TSMC reports record Q1 revenue as AI chip demand surges 40% year-over-year", desc: "Taiwan semiconductor giant sees $25.8B quarterly revenue driven by NVIDIA and Apple advanced chip orders", source: "Bloomberg" },
  { region: "asia", title: "India's UPI processes 16 billion transactions in March, PhonePe leads at 48% share", desc: "Digital payments infrastructure crosses milestone as government pushes for UPI international expansion", source: "Inc42" },
  { region: "americas", title: "Nubank reaches 100 million customers across Latin America, eyes profitability milestone", desc: "Brazilian fintech giant expands to Colombia and Mexico while maintaining 30% year-over-year revenue growth", source: "Rest of World" },
  { region: "africa", title: "Flutterwave secures Central Bank of Nigeria payment license after two-year regulatory battle", desc: "Africa's most valuable startup finally clears regulatory hurdle, unlocking direct bank settlement across Nigeria", source: "TechCabal" },
];

async function main() {
  console.log("Generating extra articles for thin regions...\n");
  let created = 0;

  for (const s of STORIES) {
    const slug = slugify(s.title);
    const { data: existing } = await db.from("articles").select("id").eq("slug", slug).single();
    if (existing) { console.log(`SKIP: ${s.title.slice(0, 50)}`); continue; }

    try {
      console.log(`Generating [${s.region}]: ${s.title.slice(0, 55)}...`);
      const text = await callClaude(`Headline: ${s.title}\nDescription: ${s.desc}\nSource: ${s.source}\nRegion: ${s.region}\n\nWrite from inside this region. Local perspective.`);
      const cleaned = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "").trim();
      const article = JSON.parse(cleaned);
      if (article.skip) { console.log(`  Skipped: ${article.reason}`); continue; }

      // Clean any em-dashes
      for (const key of Object.keys(article)) {
        if (typeof article[key] === "string") {
          article[key] = article[key].replace(/\s*[—–]\s*/g, ", ").replace(/,\s*,/g, ",");
        }
      }

      const { error } = await db.from("articles").insert({
        slug, headline: article.headline, subheadline: article.subheadline, category: article.category,
        region: s.region, what_happened: article.what_happened, why_it_matters: article.why_it_matters,
        who_wins_loses: article.who_wins_loses, what_to_watch: article.what_to_watch, full_body: article.full_body,
        source_urls: [], source_headlines: [s.title], signal_score: parseInt(article.signal_score) || 50,
        signal_sources: ["News"], social_context: article.social_pulse || null,
      });
      if (error) console.log(`  DB Error: ${error.message}`);
      else { created++; console.log(`  CREATED: ${article.headline.slice(0, 55)}`); }
    } catch (e) { console.log(`  ERROR: ${e.message?.slice(0, 60)}`); }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log(`\nDone. Created ${created} extra articles.`);
}

main().catch(console.error);
