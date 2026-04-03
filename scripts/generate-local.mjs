#!/usr/bin/env node
// Local article generator — bypasses Vercel timeout limits
// Run: node scripts/generate-local.mjs

import { createClient } from "@supabase/supabase-js";

// Reads from environment variables — set via GitHub Actions secrets or .env.local
// For local runs: load from .env.local
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
  } catch { /* .env.local not found — use existing env vars */ }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.VANTAGE_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_KEY) {
  console.error("Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const REGIONS = {
  global: { label: "Global" },
  africa: { label: "Africa" },
  asia: { label: "Asia" },
  europe: { label: "Europe" },
  americas: { label: "Americas" },
  middleeast: { label: "Middle East" },
};

const REGIONAL_FEEDS = [
  { name: "TechCabal", url: "https://techcabal.com/feed/", region: "africa" },
  { name: "TechPoint Africa", url: "https://techpoint.africa/feed/", region: "africa" },
  { name: "Disrupt Africa", url: "https://disrupt-africa.com/feed/", region: "africa" },
  { name: "IT News Africa", url: "https://www.itnewsafrica.com/feed/", region: "africa" },
  { name: "MyBroadband", url: "https://mybroadband.co.za/news/feed", region: "africa" },
  { name: "Tech in Asia", url: "https://www.techinasia.com/feed", region: "asia" },
  { name: "e27", url: "https://e27.co/feed/", region: "asia" },
  { name: "Inc42", url: "https://inc42.com/feed/", region: "asia" },
  { name: "Sifted", url: "https://sifted.eu/feed", region: "europe" },
  { name: "The Next Web", url: "https://thenextweb.com/feed/", region: "europe" },
  { name: "EU-Startups", url: "https://www.eu-startups.com/feed/", region: "europe" },
  { name: "Rest of World", url: "https://restofworld.org/feed/latest/", region: "americas" },
  { name: "BetaKit", url: "https://betakit.com/feed/", region: "americas" },
  { name: "Wamda", url: "https://www.wamda.com/feed", region: "middleeast" },
  { name: "Zawya Tech", url: "https://www.zawya.com/en/tech/rss.xml", region: "middleeast" },
];

const PROMPT = `You are the most dangerous editorial mind in technology journalism. You are the intelligence engine behind Vantage, the publication that CTOs, VCs, heads of state, and the builders who actually shape the future read before anyone else. You combine the analytical precision of Ben Thompson, the financial fluency of Matt Levine, the geopolitical instinct of The Economist, and the irreverence of someone who has built and broken companies firsthand.

YOUR CORE IDENTITY:
You are not a summarizer. You are not a reporter. You are a strategist who writes. Every article you produce must contain at least one insight that the reader cannot get anywhere else. One connection nobody drew. One implication nobody calculated.

THE VANTAGE STANDARD:

1. EVERY HEADLINE IS A VERDICT. "Company X Acquires Startup Y" is garbage. Your headline must contain a thesis, a judgment, or a provocation.

2. FIRST PARAGRAPH: THE WEAPON. Start with a number that shocks, a comparison that reframes reality, or a statement so counterintuitive the reader needs to verify it. Never open with "In a move that..." or "According to reports..."

3. FOLLOW THE MONEY. ALWAYS. Every tech story is a financial story. Who is paying? What margin is being protected? Be specific: "$4.2 billion" not "billions."

4. NAME NAMES. CITE NUMBERS. MARK DATES. "Several major companies" is lazy. "Alphabet ($1.9T), Meta ($1.3T), and Amazon ($1.8T)" is Vantage.

5. SEE THE CHESS GAME, NOT JUST THE MOVE. A funding round reveals which VCs believe in which thesis. A regulation is a weapon in a geopolitical power struggle. Draw the line between the event and the larger forces.

6. THE GLOBAL LENS. Write from inside each region, not as an outsider looking in.

7. MAKE PREDICTIONS. STAKE YOUR REPUTATION. Not "this space is worth watching" but "Watch Amazon's Q3 earnings call, if Andy Jassy announces X, it confirms Y."

WRITING STYLE:
- Short paragraphs. 2-3 sentences max.
- NEVER use em dashes (—). Use commas, semicolons, colons, or periods instead. This is critical.
- Zero filler. Never write "it's worth noting," "interestingly," "in today's rapidly evolving landscape."
- No passive voice unless it genuinely reads better.
- Write with earned confidence. Smart but never condescending.

IMPORTANT: If NOT a tech/business/policy/markets story: {"skip": true, "reason": "Not a tech story"}

Return ONLY raw JSON. No markdown fences. No preamble.

{
  "headline": "A verdict, not a description. Must contain a thesis.",
  "subheadline": "One sharp sentence deepening the headline.",
  "category": "One of: AI, Infrastructure, Startups, Big Tech, Policy, Markets",
  "what_happened": "2-3 paragraphs. Names, numbers, dates.",
  "why_it_matters": "3-4 paragraphs. Strong position. Second-order effects. At least one insight nobody else is seeing.",
  "who_wins_loses": "2-3 paragraphs. Name specific companies, executives, countries.",
  "what_to_watch": "1-2 paragraphs. Specific dates, falsifiable predictions.",
  "social_pulse": "1 paragraph or null",
  "full_body": "Complete article, 800+ words. Publication-ready prose. Hook opening. Strong argument.",
  "signal_score": "Integer 1-100. Be honest."
}`;

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function cleanHtml(text) {
  return text.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function extractTag(xml, tag) {
  const cdata = xml.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, "i"));
  if (cdata) return cdata[1].trim();
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1].trim() : null;
}

function extractLink(xml) {
  const tag = xml.match(/<link[^>]*>([^<]+)<\/link>/i);
  if (tag) return tag[1].trim();
  const atom = xml.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  return atom ? atom[1].trim() : null;
}

async function fetchFeed(source) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(source.url, { signal: controller.signal, headers: { "User-Agent": "Vantage/1.0" } });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const xml = await res.text();
    const items = [];
    const matches = [...xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/gi), ...xml.matchAll(/<entry[\s>]([\s\S]*?)<\/entry>/gi)];
    for (const m of matches.slice(0, 5)) {
      const title = extractTag(m[1], "title");
      if (!title || title.length < 10) continue;
      const desc = extractTag(m[1], "description") || extractTag(m[1], "summary");
      const link = extractLink(m[1]);
      items.push({ title: cleanHtml(title), description: desc ? cleanHtml(desc).slice(0, 300) : null, url: link || "", source: { name: source.name } });
    }
    return items;
  } catch { return []; }
}

async function fetchGlobalNews() {
  const queries = [
    "artificial intelligence OR OpenAI OR Anthropic OR Google AI",
    "startup funding OR Series A OR unicorn OR IPO tech",
    "cybersecurity OR ransomware OR data breach",
    "NVIDIA OR TSMC OR semiconductor OR AI chip",
    "tech regulation OR antitrust OR EU digital",
    "fintech OR digital payments OR crypto regulation",
  ];
  const q = queries[new Date().getUTCHours() % queries.length];
  const from = new Date(Date.now() - 48 * 3600 * 1000).toISOString().split("T")[0];
  try {
    const res = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&from=${from}&sortBy=relevancy&pageSize=15&language=en&apiKey=${NEWS_API_KEY}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles || []).filter(a => a.title && a.title.length > 10);
  } catch { return []; }
}

async function callClaude(userContent) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2500,
      system: PROMPT,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

async function generateForRegion(region, headlines) {
  const label = REGIONS[region]?.label || region;
  let created = 0;

  for (const news of headlines) {
    if (created >= 2) break; // 2 articles per region

    const slug = slugify(news.title);
    const { data: existing } = await db.from("articles").select("id").eq("slug", slug).single();
    if (existing) { console.log(`  SKIP: ${news.title.slice(0, 60)}...`); continue; }

    try {
      let content = `Headline: ${news.title}\nDescription: ${news.description || "No description."}\nSource: ${news.source.name}\nRegion: ${label}`;
      if (region !== "global") content += `\n\nWrite from inside ${label}. Local perspective.`;

      console.log(`  Generating: ${news.title.slice(0, 60)}...`);
      const text = await callClaude(content);
      const cleaned = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "").trim();
      const article = JSON.parse(cleaned);

      if (article.skip) { console.log(`  SKIPPED: ${article.reason}`); continue; }

      const { error } = await db.from("articles").insert({
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
        source_urls: [news.url],
        source_headlines: [news.title],
        signal_score: parseInt(article.signal_score) || 50,
        signal_sources: ["News"],
        social_context: article.social_pulse || null,
      });

      if (error) { console.log(`  DB ERROR: ${error.message}`); }
      else { created++; console.log(`  CREATED: ${article.headline.slice(0, 60)}`); }
    } catch (err) {
      console.log(`  ERROR: ${err.message?.slice(0, 80)}`);
    }
  }
  return created;
}

async function main() {
  console.log("=== Vantage Local Article Generator ===\n");

  // First expire old articles
  const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: expired } = await db.from("articles").select("id").lt("published_at", cutoff);
  if (expired?.length > 0) {
    await db.from("articles").delete().lt("published_at", cutoff);
    console.log(`Expired ${expired.length} old articles\n`);
  }

  let totalCreated = 0;

  // Global
  console.log("[GLOBAL]");
  const globalNews = await fetchGlobalNews();
  console.log(`  Found ${globalNews.length} headlines`);
  totalCreated += await generateForRegion("global", globalNews);

  // Regional
  for (const region of ["africa", "asia", "europe", "americas", "middleeast"]) {
    console.log(`\n[${region.toUpperCase()}]`);
    const feeds = REGIONAL_FEEDS.filter(f => f.region === region);
    const results = await Promise.all(feeds.map(fetchFeed));
    const articles = results.flat();
    // Shuffle
    for (let i = articles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [articles[i], articles[j]] = [articles[j], articles[i]];
    }
    console.log(`  Found ${articles.length} headlines from ${feeds.length} feeds`);
    if (articles.length === 0) {
      console.log("  Falling back to global news");
      totalCreated += await generateForRegion(region, globalNews.slice(5));
    } else {
      totalCreated += await generateForRegion(region, articles);
    }
  }

  console.log(`\n=== Done. Created ${totalCreated} articles ===`);
}

main().catch(console.error);
