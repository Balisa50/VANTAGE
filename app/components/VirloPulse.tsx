"use client";

import { useState, useEffect } from "react";

interface TrendItem {
  name?: string;
  hashtag?: string;
  tag?: string;
  views?: number;
  view_count?: number;
  videos?: number;
  video_count?: number;
  platform?: string;
}

const PLATFORMS = [
  { key: "tiktok", label: "TikTok", icon: "T" },
  { key: "youtube", label: "YouTube", icon: "Y" },
  { key: "instagram", label: "Reels", icon: "I" },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function VirloPulse() {
  const [platform, setPlatform] = useState("tiktok");
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/virlo-trends?platform=${platform}&limit=10`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => {
        if (!cancelled) {
          const items = Array.isArray(data.trends) ? data.trends : [];
          setTrends(items);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [platform]);

  // Don't render anything if Virlo isn't configured
  if (error && trends.length === 0 && !loading) return null;

  return (
    <div className="mb-10 p-5 rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 pulse-dot" />
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-purple-400">
            Social Pulse
          </span>
          <span className="text-[9px] font-mono text-text-secondary/40 ml-1">
            via Virlo
          </span>
        </div>

        <div className="flex items-center gap-1">
          {PLATFORMS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPlatform(p.key)}
              className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all ${
                platform === p.key
                  ? "bg-purple-500/10 text-purple-400 border-purple-500/25"
                  : "text-text-secondary border-border hover:border-purple-500/15"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 rounded shimmer" />
          ))}
        </div>
      ) : trends.length === 0 ? (
        <p className="text-sm text-text-secondary/50 font-mono text-center py-4">
          No social signals right now
        </p>
      ) : (
        <div className="space-y-1">
          {trends.map((trend, i) => {
            const name = trend.name || trend.hashtag || trend.tag || `#trend-${i}`;
            const views = trend.views || trend.view_count || 0;
            const videos = trend.videos || trend.video_count || 0;

            return (
              <div
                key={i}
                className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-surface-elevated transition-colors"
              >
                <span
                  className={`text-xs font-mono w-5 text-center ${
                    i < 3 ? "text-purple-400 font-semibold" : "text-text-secondary/40"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="text-sm text-text-primary font-mono flex-1 truncate">
                  {name.startsWith("#") ? name : `#${name}`}
                </span>
                {views > 0 && (
                  <span className="text-[10px] font-mono text-text-secondary">
                    {formatNumber(views)} views
                  </span>
                )}
                {videos > 0 && (
                  <span className="text-[10px] font-mono text-text-secondary/50">
                    {formatNumber(videos)} vids
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border/50">
        <p className="text-[9px] font-mono text-text-secondary/30 text-center">
          Powered by Virlo API
        </p>
      </div>
    </div>
  );
}
