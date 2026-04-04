import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const REGIONS = ["global", "africa", "asia", "europe", "americas", "middleeast"];
const REGION_LABELS: Record<string, string> = {
  global: "Global", africa: "Africa", asia: "Asia",
  europe: "Europe", americas: "Americas", middleeast: "Middle East",
};

const REGIONAL_FEEDS: { name: string; url: string; region: string }[] = [
  { name: "TechCabal", url: "https://techcabal.com/feed/", region: "africa" },
  { name: "TechPoint Africa", url: "https://techpoint.africa/feed/", region: "africa" },
  { name: "IT News Africa", url: "https://www.itnewsafrica.com/feed/", region: "africa" },
  { name: "Tech in Asia", url: "https://www.techinasia.com/feed", region: "asia" },
  { name: "e27", url: "https://e27.co/feed/", region: "asia" },
  { name: "Inc42", url: "https://inc42.com/feed/", region: "asia" },
  { name: "Sifted", url: "https://sifted.eu/feed", region: "europe" },
  { name: "The Next Web", url: "https://thenextweb.com/feed/", region: "europe" },
  { name: "EU-Startups", url: "https://www.eu-startups.com/feed/", region: "europe" },
  { name: "Rest of World", url: "https://restofworld.org/feed/latest/", region: "americas" },
  { name: "BetaKit", url: "https://betakit.com/feed/", region: "americas" },
  { name: "Zawya Tech", url: "https://www.zawya.com/en/tech/rss.xml", region: "middleeast" },
];

function cleanHtml(t: string) {
  return t.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function extractTag(xml: string, tag: string) {
  const cdata = xml.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, "i"));
  if (cdata) return cdata[1].trim();
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1].trim() : null;
}

function extractLink(xml: string) {
  const tag = xml.match(/<link[^>]*>([^<]+)<\/link>/i);
  if (tag) return tag[1].trim();
  const atom = xml.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  return atom ? atom[1].trim() : null;
}

async function fetchFeed(source: { name: string; url: string }) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(source.url, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const xml = await res.text();
    const matches = [...xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/gi), ...xml.matchAll(/<entry[\s>]([\s\S]*?)<\/entry>/gi)];
    return matches.slice(0, 3).map(m => {
      const title = extractTag(m[1], "title");
      if (!title || title.length < 10) return null;
      const desc = extractTag(m[1], "description") || extractTag(m[1], "summary");
      return { title: cleanHtml(title), description: desc ? cleanHtml(desc).slice(0, 200) : null, source: source.name };
    }).filter(Boolean);
  } catch { return []; }
}

async function fetchGlobalNews() {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];
  const queries = ["artificial intelligence OR OpenAI OR Anthropic", "startup funding OR unicorn OR IPO tech", "cybersecurity OR data breach", "NVIDIA OR TSMC OR semiconductor", "tech regulation OR antitrust"];
  const q = queries[new Date().getUTCHours() % queries.length];
  const from = new Date(Date.now() - 48 * 3600 * 1000).toISOString().split("T")[0];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&from=${from}&sortBy=relevancy&pageSize=6&language=en&apiKey=${apiKey}`, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles || []).filter((a: { title: string }) => a.title?.length > 10).map((a: { title: string; description: string; source: { name: string } }) => ({ title: a.title, description: a.description, source: a.source.name }));
  } catch { return []; }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vantage-three-chi.vercel.app";
  const cronSecret = process.env.CRON_SECRET ?? "";
  let dispatched = 0;

  // Expire old articles
  fetch(`${siteUrl}/api/expire`, {
    method: "POST",
    headers: { "x-api-secret": cronSecret },
  }).catch(() => {});

  // Fetch headlines for each region in parallel (fast: 2s timeout each)
  const globalNewsPromise = fetchGlobalNews();

  const regionFeedPromises = REGIONS.filter(r => r !== "global").map(async (region) => {
    const feeds = REGIONAL_FEEDS.filter(f => f.region === region);
    const results = await Promise.all(feeds.map(fetchFeed));
    const articles = results.flat().filter(Boolean);
    // Shuffle
    for (let i = articles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [articles[i], articles[j]] = [articles[j], articles[i]];
    }
    return { region, articles: articles.slice(0, 2) };
  });

  const [globalNews, ...regionResults] = await Promise.all([globalNewsPromise, ...regionFeedPromises]);

  // Fire generate-one for global headlines (pick 2)
  for (const headline of (globalNews as { title: string; description: string | null; source: string }[]).slice(0, 2)) {
    fetch(`${siteUrl}/api/generate-one`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-chain-secret": cronSecret },
      body: JSON.stringify({ ...headline, region: "global", regionLabel: "Global" }),
    }).catch(() => {});
    dispatched++;
  }

  // Fire generate-one for each regional headline
  for (const { region, articles } of regionResults) {
    const headlines = articles as { title: string; description: string | null; source: string }[];
    if (headlines.length === 0) {
      // Fallback: use a global headline for this region
      const fallback = (globalNews as { title: string; description: string | null; source: string }[])[dispatched % globalNews.length];
      if (fallback) {
        fetch(`${siteUrl}/api/generate-one`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-chain-secret": cronSecret },
          body: JSON.stringify({ ...fallback, region, regionLabel: REGION_LABELS[region] }),
        }).catch(() => {});
        dispatched++;
      }
    } else {
      for (const headline of headlines.slice(0, 1)) {
        fetch(`${siteUrl}/api/generate-one`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-chain-secret": cronSecret },
          body: JSON.stringify({ ...headline, region, regionLabel: REGION_LABELS[region] }),
        }).catch(() => {});
        dispatched++;
      }
    }
  }

  // Virlo integration: fetch trending social topics and generate articles from viral signals
  const virloKey = process.env.VIRLO_API_KEY;
  if (virloKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const virloRes = await fetch(
        "https://api.virlo.ai/v1/hashtags?limit=5&order_by=views&sort=desc",
        { headers: { Authorization: `Bearer ${virloKey}` }, signal: controller.signal }
      );
      clearTimeout(timeout);

      if (virloRes.ok) {
        const virloData = await virloRes.json();
        const hashtags = (virloData.data || virloData.hashtags || []).slice(0, 1);
        for (const tag of hashtags) {
          const tagName = tag.name || tag.hashtag || tag.tag;
          if (tagName) {
            fetch(`${siteUrl}/api/generate-one`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-chain-secret": cronSecret },
              body: JSON.stringify({
                title: `${tagName} is trending across social media with ${tag.views || tag.view_count || "millions of"} views`,
                description: `The hashtag ${tagName} is going viral on TikTok, YouTube, and Instagram. Analyze the technology and business implications behind this social media trend.`,
                source: "Virlo Social Intelligence",
                region: "global",
                regionLabel: "Global",
              }),
            }).catch(() => {});
            dispatched++;
          }
        }
      }
    } catch {
      // Virlo unavailable — continue without it
    }
  }

  return NextResponse.json({
    triggered: true,
    dispatched,
    virlo: !!virloKey,
    timestamp: new Date().toISOString(),
    message: `Dispatched ${dispatched} article generations across ${REGIONS.length} regions${virloKey ? " + Virlo social signals" : ""}`,
  });
}
