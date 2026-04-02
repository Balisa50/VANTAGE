// Virlo API integration — social video intelligence (4th signal source)
// https://virlo.ai/for-developers

const VIRLO_BASE = "https://api.virlo.ai/v1";

export interface VirloTrend {
  hashtag: string;
  views: number;
  usage_count: number;
}

export interface VirloDigestVideo {
  title: string;
  views: number;
  likes: number;
  platform: string;
  url: string;
}

export interface VirloSignal {
  trendingHashtags: VirloTrend[];
  topVideos: VirloDigestVideo[];
}

async function virloFetch(endpoint: string): Promise<Response | null> {
  const apiKey = process.env.VIRLO_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${VIRLO_BASE}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res;
  } catch {
    return null;
  }
}

export async function fetchVirloSignals(): Promise<VirloSignal | null> {
  try {
    // Fetch trending tech hashtags and top videos in parallel
    const [hashtagRes, digestRes] = await Promise.all([
      virloFetch("/hashtags?limit=10&order_by=views&sort=desc"),
      virloFetch("/videos/digest?limit=10"),
    ]);

    const trendingHashtags: VirloTrend[] = [];
    const topVideos: VirloDigestVideo[] = [];

    if (hashtagRes) {
      const data = await hashtagRes.json();
      const hashtags = data.data ?? data.hashtags ?? data ?? [];
      for (const h of Array.isArray(hashtags) ? hashtags : []) {
        if (h.hashtag || h.name) {
          trendingHashtags.push({
            hashtag: h.hashtag ?? h.name,
            views: h.views ?? h.total_views ?? 0,
            usage_count: h.usage_count ?? h.count ?? 0,
          });
        }
      }
    }

    if (digestRes) {
      const data = await digestRes.json();
      const videos = data.data ?? data.videos ?? data ?? [];
      for (const v of Array.isArray(videos) ? videos : []) {
        if (v.title) {
          topVideos.push({
            title: v.title,
            views: v.views ?? v.view_count ?? 0,
            likes: v.likes ?? v.like_count ?? 0,
            platform: v.platform ?? "unknown",
            url: v.url ?? "",
          });
        }
      }
    }

    if (trendingHashtags.length === 0 && topVideos.length === 0) return null;

    return { trendingHashtags, topVideos };
  } catch (err) {
    console.error("Virlo signal fetch failed:", err);
    return null;
  }
}

export function formatVirloContext(signals: VirloSignal): string {
  const parts: string[] = [];

  if (signals.trendingHashtags.length > 0) {
    parts.push("VIRLO — TRENDING VIDEO HASHTAGS (TikTok/YouTube/Instagram):");
    for (const h of signals.trendingHashtags) {
      parts.push(
        `- #${h.hashtag} (${formatViews(h.views)} views, ${h.usage_count} videos)`
      );
    }
  }

  if (signals.topVideos.length > 0) {
    parts.push("\nVIRLO — TOP PERFORMING TECH VIDEOS (last 48h):");
    for (const v of signals.topVideos.slice(0, 5)) {
      parts.push(
        `- "${v.title}" on ${v.platform} (${formatViews(v.views)} views, ${formatViews(v.likes)} likes)`
      );
    }
  }

  return parts.join("\n");
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}
