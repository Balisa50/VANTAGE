// HackerNews signal intelligence — free API, no key needed
// https://github.com/HackerNews/API

interface HNItem {
  id: number;
  title: string;
  url?: string;
  score: number;
  descendants: number; // comment count
  by: string;
  time: number;
  type: string;
}

export interface HNSignal {
  topStories: {
    title: string;
    score: number;
    comments: number;
    url: string;
    hnUrl: string;
  }[];
  showHN: {
    title: string;
    score: number;
    comments: number;
    url: string;
    hnUrl: string;
  }[];
}

async function fetchItem(id: number): Promise<HNItem | null> {
  try {
    const res = await fetch(
      `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchTopIds(endpoint: string, limit: number): Promise<number[]> {
  try {
    const res = await fetch(
      `https://hacker-news.firebaseio.com/v0/${endpoint}.json`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const ids: number[] = await res.json();
    return ids.slice(0, limit);
  } catch {
    return [];
  }
}

export async function fetchHNSignals(): Promise<HNSignal | null> {
  try {
    // Fetch top stories and Show HN in parallel
    const [topIds, showIds] = await Promise.all([
      fetchTopIds("topstories", 15),
      fetchTopIds("showstories", 10),
    ]);

    // Fetch all items in parallel
    const [topItems, showItems] = await Promise.all([
      Promise.all(topIds.map(fetchItem)),
      Promise.all(showIds.map(fetchItem)),
    ]);

    const mapItem = (item: HNItem | null) => {
      if (!item || !item.title) return null;
      return {
        title: item.title,
        score: item.score ?? 0,
        comments: item.descendants ?? 0,
        url: item.url ?? `https://news.ycombinator.com/item?id=${item.id}`,
        hnUrl: `https://news.ycombinator.com/item?id=${item.id}`,
      };
    };

    const topStories = topItems
      .map(mapItem)
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.score + b.comments - (a.score + a.comments))
      .slice(0, 10);

    const showHN = showItems
      .map(mapItem)
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (topStories.length === 0) return null;

    return { topStories, showHN };
  } catch (err) {
    console.error("HackerNews signal fetch failed:", err);
    return null;
  }
}

// Convert top HN stories into NewsArticle-compatible format for direct article generation
export function getHNAsHeadlines(signals: HNSignal): {
  title: string;
  description: string | null;
  url: string;
  source: { name: string };
}[] {
  return signals.topStories
    .filter((s) => s.url && !s.url.includes("news.ycombinator.com"))
    .slice(0, 5)
    .map((s) => ({
      title: s.title,
      description: `Trending on HackerNews with ${s.score} points and ${s.comments} comments.`,
      url: s.url,
      source: { name: "HackerNews" },
    }));
}

export function formatHNContext(signals: HNSignal): string {
  const parts: string[] = [];

  if (signals.topStories.length > 0) {
    parts.push("HACKER NEWS — TOP STORIES RIGHT NOW:");
    for (const s of signals.topStories) {
      parts.push(
        `- "${s.title}" (${s.score} points, ${s.comments} comments) ${s.hnUrl}`
      );
    }
  }

  if (signals.showHN.length > 0) {
    parts.push("\nSHOW HN — WHAT BUILDERS ARE SHIPPING:");
    for (const s of signals.showHN) {
      parts.push(
        `- "${s.title}" (${s.score} points, ${s.comments} comments)`
      );
    }
  }

  return parts.join("\n");
}
