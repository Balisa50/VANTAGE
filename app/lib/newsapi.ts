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

// Rotate queries each run so we don't get the same "everything" results
const QUERY_SETS = [
  "artificial intelligence OR machine learning",
  "startup OR venture capital OR funding",
  "cybersecurity OR data breach OR hacking",
  "cloud computing OR SaaS OR infrastructure",
  "semiconductor OR chip OR NVIDIA OR AMD",
  "tech regulation OR antitrust OR privacy law",
  "fintech OR crypto OR blockchain OR payments",
  "open source OR developer tools OR API",
];

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

  // Use "everything" endpoint — it has far more content and works globally
  const res = await fetch(
    `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${from}&sortBy=publishedAt&pageSize=10&language=en&apiKey=${apiKey}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    // Fallback to top-headlines
    const fallback = await fetch(
      `https://newsapi.org/v2/top-headlines?category=technology&language=en&pageSize=10&apiKey=${apiKey}`,
      { cache: "no-store" }
    );
    if (!fallback.ok) return [];
    const data = await fallback.json();
    return (data.articles ?? []).filter(
      (a: NewsArticle) => a.title && a.title !== "[Removed]"
    );
  }

  const data = await res.json();
  const articles = (data.articles ?? []).filter(
    (a: NewsArticle) => a.title && a.title !== "[Removed]"
  );

  // Tag articles with region info if applicable
  return articles;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
