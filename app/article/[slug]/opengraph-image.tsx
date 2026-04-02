import { ImageResponse } from "next/og";
import { supabase, type Article } from "../../lib/supabase";

export const alt = "Vantage Article";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CATEGORY_COLORS: Record<string, string> = {
  AI: "#f59e0b",
  Infrastructure: "#3b82f6",
  Startups: "#22c55e",
  "Big Tech": "#a855f7",
  Policy: "#ef4444",
  Markets: "#14b8a6",
};

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data } = await supabase
    .from("articles")
    .select("headline, subheadline, category, signal_score, signal_sources")
    .eq("slug", slug)
    .single();

  const article = data as Pick<
    Article,
    "headline" | "subheadline" | "category" | "signal_score" | "signal_sources"
  > | null;

  const headline = article?.headline ?? "Vantage Intelligence";
  const category = article?.category ?? "Tech";
  const score = article?.signal_score ?? 50;
  const accentColor = CATEGORY_COLORS[category] ?? "#f59e0b";
  const signalCount = article?.signal_sources?.length ?? 1;
  const signalLabel =
    signalCount >= 3 ? "TRI-SIGNAL" : signalCount === 2 ? "DUAL SIGNAL" : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0a0a0a",
          padding: "60px",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span
              style={{
                fontSize: "14px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: accentColor,
                fontFamily: "sans-serif",
              }}
            >
              {category}
            </span>
            {signalLabel && (
              <span
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#f59e0b",
                  border: "1px solid rgba(245,158,11,0.3)",
                  borderRadius: "20px",
                  padding: "4px 12px",
                  fontFamily: "sans-serif",
                }}
              >
                {signalLabel}
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: "14px",
              color: score >= 70 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#22c55e",
              fontFamily: "sans-serif",
            }}
          >
            Signal {score}
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <h1
            style={{
              fontSize: headline.length > 80 ? "36px" : headline.length > 50 ? "44px" : "52px",
              lineHeight: 1.2,
              color: "#f5f5f0",
              fontFamily: "serif",
              fontWeight: 600,
              margin: 0,
            }}
          >
            {headline}
          </h1>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #1e1e1e",
            paddingTop: "24px",
          }}
        >
          <span
            style={{
              fontSize: "32px",
              letterSpacing: "0.05em",
              color: "#f5f5f0",
              fontFamily: "serif",
            }}
          >
            VANTAGE
          </span>
          <span
            style={{
              fontSize: "13px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#888888",
              fontFamily: "sans-serif",
            }}
          >
            AI-Powered Tech Intelligence
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
