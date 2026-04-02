export interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  source: { name: string };
}

export const REGIONS: Record<string, { label: string; countries: string[]; emoji: string }> = {
  global: { label: "Global", countries: ["us", "gb"], emoji: "🌍" },
  africa: { label: "Africa", countries: ["za", "ng", "eg"], emoji: "🌍" },
  asia: { label: "Asia", countries: ["in", "jp", "kr", "sg"], emoji: "🌏" },
  europe: { label: "Europe", countries: ["gb", "de", "fr"], emoji: "🌍" },
  americas: { label: "Americas", countries: ["us", "ca", "br", "mx"], emoji: "🌎" },
  middleeast: { label: "Middle East", countries: ["ae", "sa", "il"], emoji: "🌍" },
};

// High-signal queries that pull genuinely important tech stories
const QUERY_SETS = [
  "artificial intelligence OR OpenAI OR Anthropic OR Google AI OR foundation model",
  "startup funding OR Series A OR Series B OR unicorn OR IPO tech",
  "cybersecurity breach OR ransomware OR zero-day OR data leak",
  "cloud computing OR AWS OR Azure OR Google Cloud OR datacenter",
  "NVIDIA OR AMD OR TSMC OR semiconductor shortage OR AI chip",
  "tech regulation OR antitrust OR EU digital OR AI safety law",
  "fintech OR digital payments OR neobank OR crypto regulation",
  "developer tools OR open source OR GitHub OR API platform",
];

// Words that indicate low-quality consumer clickbait, not tech intelligence
const JUNK_PATTERNS = [
  /best deal/i, /percent off/i, /on sale/i, /price drop/i, /save \$/i,
  /buying guide/i, /which .+ should you buy/i, /vs\./i,
  /charging cable/i, /power bank/i, /phone case/i, /screen protector/i,
  /art book/i, /cookbook/i, /recipe/i,
  /\[removed\]/i, /sponsored/i, /affiliate/i,
  /horoscope/i, /zodiac/i, /celebrity/i,
  /game patch notes/i, /patch \d+\.\d+/i, /skin bundle/i,
  /coupon/i, /promo code/i, /cashback/i,
];

function isJunk(title: string, description: string | null): boolean {
  const text = `${title} ${description ?? ""}`;
  return JUNK_PATTERNS.some((pattern) => pattern.test(text));
}

export async function fetchTopTechHeadlines(
  regionKey?: string
): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) throw new Error("NEWS_API_KEY not set");

  // Pick a query based on current hour so each run gets different results
  const queryIdx = new Date().getUTCHours() % QUERY_SETS.length;
  const query = QUERY_SETS[queryIdx];

  const now = new Date();
  const from = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Use "everything" endpoint for broader, better content
  const res = await fetch(
    `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${from}&sortBy=relevancy&pageSize=20&language=en&apiKey=${apiKey}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    // Fallback to top-headlines
    const fallback = await fetch(
      `https://newsapi.org/v2/top-headlines?category=technology&language=en&pageSize=15&apiKey=${apiKey}`,
      { cache: "no-store" }
    );
    if (!fallback.ok) return [];
    const data = await fallback.json();
    return (data.articles ?? []).filter(
      (a: NewsArticle) => a.title && !isJunk(a.title, a.description)
    );
  }

  const data = await res.json();
  const articles = (data.articles ?? [])
    .filter((a: NewsArticle) => a.title && !isJunk(a.title, a.description))
    // Prefer articles from known quality sources
    .sort((a: NewsArticle, b: NewsArticle) => {
      const quality = [
        "Reuters", "Bloomberg", "TechCrunch", "The Verge", "Ars Technica",
        "Wired", "MIT Technology Review", "The Information", "CNBC",
        "Financial Times", "WSJ", "BBC News", "The Guardian",
      ];
      const aScore = quality.includes(a.source.name) ? 1 : 0;
      const bScore = quality.includes(b.source.name) ? 1 : 0;
      return bScore - aScore;
    });

  return articles;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
