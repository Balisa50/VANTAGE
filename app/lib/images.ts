// Free Unsplash images by category — no API key needed
// Uses Unsplash Source which redirects to a random relevant photo

const CATEGORY_QUERIES: Record<string, string> = {
  AI: "artificial intelligence,neural network,robot",
  Infrastructure: "server room,data center,cloud computing",
  Startups: "startup office,technology workspace,innovation",
  "Big Tech": "silicon valley,technology company,tech headquarters",
  Policy: "government technology,regulation,congress",
  Markets: "stock market,trading,finance technology",
};

const FALLBACK_QUERY = "technology,digital,future";

export function getArticleImageUrl(
  category: string | null,
  slug: string
): string {
  const query = CATEGORY_QUERIES[category ?? ""] ?? FALLBACK_QUERY;
  // Use slug as a seed so the same article always gets the same image
  const seed = slug.slice(0, 20);
  return `https://source.unsplash.com/featured/1200x630/?${encodeURIComponent(query)}&sig=${seed}`;
}

export function getUnsplashImageUrl(
  keyword: string,
  width: number = 1200,
  height: number = 630
): string {
  return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(keyword)}`;
}
