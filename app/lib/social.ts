// Reddit-powered social signal intelligence (free, no API key needed)

const SUBREDDITS = [
  "technology",
  "programming",
  "artificial",
  "machinelearning",
  "startups",
  "tech",
];

interface RedditPost {
  title: string;
  score: number;
  num_comments: number;
  subreddit: string;
  url: string;
  selftext?: string;
  created_utc: number;
}

export interface SocialSignal {
  hotPosts: {
    title: string;
    score: number;
    comments: number;
    subreddit: string;
    url: string;
  }[];
  topDiscussions: {
    title: string;
    score: number;
    comments: number;
    subreddit: string;
  }[];
}

async function fetchSubreddit(
  sub: string,
  sort: "hot" | "top"
): Promise<RedditPost[]> {
  try {
    const timeParam = sort === "top" ? "&t=day" : "";
    const res = await fetch(
      `https://www.reddit.com/r/${sub}/${sort}.json?limit=5${timeParam}`,
      {
        headers: {
          "User-Agent": "Vantage-Newsroom/1.0",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const children = data?.data?.children ?? [];
    return children.map(
      (c: { data: RedditPost }) => c.data
    );
  } catch {
    return [];
  }
}

export async function fetchSocialSignals(): Promise<SocialSignal | null> {
  try {
    // Fetch hot and top posts from tech subreddits in parallel
    const fetches = SUBREDDITS.flatMap((sub) => [
      fetchSubreddit(sub, "hot"),
      fetchSubreddit(sub, "top"),
    ]);

    const results = await Promise.all(fetches);

    const hotPosts: RedditPost[] = [];
    const topPosts: RedditPost[] = [];

    for (let i = 0; i < results.length; i++) {
      if (i % 2 === 0) {
        hotPosts.push(...results[i]);
      } else {
        topPosts.push(...results[i]);
      }
    }

    // Sort by engagement (score + comments)
    const sortByEngagement = (a: RedditPost, b: RedditPost) =>
      b.score + b.num_comments - (a.score + a.num_comments);

    const topHot = hotPosts
      .sort(sortByEngagement)
      .slice(0, 10)
      .map((p) => ({
        title: p.title,
        score: p.score,
        comments: p.num_comments,
        subreddit: p.subreddit,
        url: p.url,
      }));

    const topDiscussions = topPosts
      .filter((p) => p.num_comments > 10)
      .sort((a, b) => b.num_comments - a.num_comments)
      .slice(0, 10)
      .map((p) => ({
        title: p.title,
        score: p.score,
        comments: p.num_comments,
        subreddit: p.subreddit,
      }));

    if (topHot.length === 0 && topDiscussions.length === 0) return null;

    return { hotPosts: topHot, topDiscussions };
  } catch (err) {
    console.error("Reddit social signals fetch failed:", err);
    return null;
  }
}

export function formatSocialContext(signals: SocialSignal): string {
  const parts: string[] = [];

  if (signals.hotPosts.length > 0) {
    parts.push("TRENDING ON REDDIT TECH COMMUNITIES RIGHT NOW:");
    for (const p of signals.hotPosts) {
      parts.push(
        `- "${p.title}" (r/${p.subreddit}, ${p.score} upvotes, ${p.comments} comments)`
      );
    }
  }

  if (signals.topDiscussions.length > 0) {
    parts.push("\nHOTTEST TECH DISCUSSIONS TODAY:");
    for (const p of signals.topDiscussions) {
      parts.push(
        `- "${p.title}" (r/${p.subreddit}, ${p.comments} comments, ${p.score} upvotes)`
      );
    }
  }

  return parts.join("\n");
}
