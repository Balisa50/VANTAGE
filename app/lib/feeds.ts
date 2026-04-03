// Regional tech news via RSS feeds from ACTUAL local publications
// No API key needed — these are public RSS/Atom feeds

import type { NewsArticle } from "./newsapi";

interface FeedSource {
  name: string;
  url: string;
  region: string;
}

// Real tech publications from each region
const REGIONAL_FEEDS: FeedSource[] = [
  // AFRICA — West, East, South, North, Pan-Africa
  { name: "TechCabal", url: "https://techcabal.com/feed/", region: "africa" },
  { name: "TechPoint Africa", url: "https://techpoint.africa/feed/", region: "africa" },
  { name: "Disrupt Africa", url: "https://disrupt-africa.com/feed/", region: "africa" },
  { name: "IT News Africa", url: "https://www.itnewsafrica.com/feed/", region: "africa" },
  { name: "Benjamindada", url: "https://benjamindada.com/feed", region: "africa" },
  { name: "CIO East Africa", url: "https://www.cio.co.ke/feed/", region: "africa" },
  { name: "Digest Africa", url: "https://digestafrica.com/feed", region: "africa" },
  { name: "WeeTracker", url: "https://weetracker.com/feed/", region: "africa" },
  { name: "Techeconomy", url: "https://techeconomy.ng/feed/", region: "africa" },
  { name: "Ventures Africa", url: "https://venturesafrica.com/feed/", region: "africa" },
  { name: "MyBroadband", url: "https://mybroadband.co.za/news/feed", region: "africa" },

  // ASIA
  { name: "Tech in Asia", url: "https://www.techinasia.com/feed", region: "asia" },
  { name: "e27", url: "https://e27.co/feed/", region: "asia" },
  { name: "KrASIA", url: "https://kr-asia.com/feed", region: "asia" },
  { name: "Inc42", url: "https://inc42.com/feed/", region: "asia" },

  // MIDDLE EAST
  { name: "Wamda", url: "https://www.wamda.com/feed", region: "middleeast" },
  { name: "Magnitt", url: "https://magnitt.com/feed", region: "middleeast" },
  { name: "Zawya Tech", url: "https://www.zawya.com/en/tech/rss.xml", region: "middleeast" },

  // EUROPE
  { name: "Sifted", url: "https://sifted.eu/feed", region: "europe" },
  { name: "The Next Web", url: "https://thenextweb.com/feed/", region: "europe" },
  { name: "EU-Startups", url: "https://www.eu-startups.com/feed/", region: "europe" },

  // AMERICAS (Latin America + Canada)
  { name: "Rest of World", url: "https://restofworld.org/feed/latest/", region: "americas" },
  { name: "LABS by Contxto", url: "https://labsnews.com/en/feed/", region: "americas" },
  { name: "BetaKit", url: "https://betakit.com/feed/", region: "americas" },

  // GLOBAL — skip heavy feeds, NewsAPI handles global
];

// Simple RSS/Atom XML parser — extracts title, description, link from feed items
function parseItems(xml: string, sourceName: string): NewsArticle[] {
  const items: NewsArticle[] = [];

  // Try RSS <item> tags first, then Atom <entry> tags
  const itemPattern = /<item[\s>]([\s\S]*?)<\/item>/gi;
  const entryPattern = /<entry[\s>]([\s\S]*?)<\/entry>/gi;

  const matches = [...xml.matchAll(itemPattern), ...xml.matchAll(entryPattern)];

  for (const match of matches.slice(0, 8)) {
    const block = match[1];

    const title = extractTag(block, "title");
    if (!title || title.length < 10) continue;

    const description = extractTag(block, "description") || extractTag(block, "summary") || extractTag(block, "content:encoded");
    const link = extractLink(block);

    items.push({
      title: cleanHtml(title),
      description: description ? cleanHtml(description).slice(0, 300) : null,
      url: link || "",
      source: { name: sourceName },
    });
  }

  return items;
}

function extractTag(xml: string, tag: string): string | null {
  // Handle CDATA
  const cdataPattern = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, "i");
  const cdataMatch = xml.match(cdataPattern);
  if (cdataMatch) return cdataMatch[1].trim();

  // Handle regular tags
  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(pattern);
  return match ? match[1].trim() : null;
}

function extractLink(xml: string): string | null {
  // RSS <link>url</link>
  const linkTag = xml.match(/<link[^>]*>([^<]+)<\/link>/i);
  if (linkTag) return linkTag[1].trim();

  // Atom <link href="url" />
  const atomLink = xml.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (atomLink) return atomLink[1].trim();

  return null;
}

function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchFeed(source: FeedSource): Promise<NewsArticle[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(source.url, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "User-Agent": "Vantage/1.0 (tech intelligence platform)",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) return [];

    const xml = await res.text();
    return parseItems(xml, source.name);
  } catch {
    return [];
  }
}

export async function fetchRegionalHeadlines(
  region: string
): Promise<NewsArticle[]> {
  const feeds = REGIONAL_FEEDS.filter((f) => f.region === region);
  if (feeds.length === 0) return [];

  // Fetch all feeds for this region in parallel
  const results = await Promise.all(feeds.map(fetchFeed));
  const allArticles = results.flat();

  // Shuffle to avoid always leading with the same source
  for (let i = allArticles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allArticles[i], allArticles[j]] = [allArticles[j], allArticles[i]];
  }

  return allArticles;
}

