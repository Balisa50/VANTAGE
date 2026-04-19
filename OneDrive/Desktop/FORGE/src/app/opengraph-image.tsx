import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "THE FORGE — AI-Powered Accountability Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #060608 0%, #0c0c12 60%, #060608 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Outer border frame */}
        <div style={{
          position: "absolute", inset: "20px",
          border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: "12px", display: "flex",
        }} />

        {/* Corner accents */}
        {[
          { top: 20, left: 20, borderTop: "2px solid #f59e0b", borderLeft: "2px solid #f59e0b" },
          { top: 20, right: 20, borderTop: "2px solid #f59e0b", borderRight: "2px solid #f59e0b" },
          { bottom: 20, left: 20, borderBottom: "2px solid #f59e0b", borderLeft: "2px solid #f59e0b" },
          { bottom: 20, right: 20, borderBottom: "2px solid #f59e0b", borderRight: "2px solid #f59e0b" },
        ].map((s, i) => (
          <div key={i} style={{ position: "absolute", width: 32, height: 32, borderRadius: 2, display: "flex", ...s }} />
        ))}

        {/* Glow */}
        <div style={{
          position: "absolute", top: "20%", left: "50%",
          transform: "translateX(-50%)",
          width: "600px", height: "400px",
          background: "radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)",
          display: "flex",
        }} />

        {/* Eyebrow */}
        <div style={{
          fontSize: 14, color: "#f59e0b",
          letterSpacing: "0.35em", textTransform: "uppercase",
          marginBottom: 20, display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ width: 32, height: 1, background: "#f59e0b", display: "flex" }} />
          AI-POWERED ACCOUNTABILITY
          <div style={{ width: 32, height: 1, background: "#f59e0b", display: "flex" }} />
        </div>

        {/* Main title */}
        <div style={{
          fontSize: 108, fontWeight: 900, color: "#ededea",
          lineHeight: 0.88, letterSpacing: "0.08em",
          display: "flex", marginBottom: 4,
        }}>
          THE
        </div>
        <div style={{
          fontSize: 108, fontWeight: 900, color: "#f59e0b",
          lineHeight: 0.88, letterSpacing: "0.08em",
          display: "flex", marginBottom: 36,
          textShadow: "0 0 60px rgba(245,158,11,0.4)",
        }}>
          FORGE
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: 22, color: "#9ca3af",
          maxWidth: 680, textAlign: "center",
          lineHeight: 1.5, display: "flex",
          marginBottom: 56,
        }}>
          The app that doesn't believe you until you prove it.
          Daily AI interrogations. Verified mastery. Real consequences.
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 0, border: "1px solid rgba(245,158,11,0.15)", borderRadius: 8, overflow: "hidden" }}>
          {[
            { v: "38", l: "Curated Paths" },
            { v: "3", l: "Questions Per Session" },
            { v: "40%", l: "Pass Threshold" },
            { v: "∞", l: "Integrity Earned" },
          ].map((s, i) => (
            <div key={s.l} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "16px 36px",
              borderRight: i < 3 ? "1px solid rgba(245,158,11,0.12)" : "none",
              background: "rgba(245,158,11,0.04)",
            }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: "#f59e0b", display: "flex", lineHeight: 1 }}>
                {s.v}
              </div>
              <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 6, display: "flex" }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>

        {/* URL */}
        <div style={{
          position: "absolute", bottom: 44,
          fontFamily: "monospace", fontSize: 13,
          color: "rgba(245,158,11,0.4)", letterSpacing: "0.1em", display: "flex",
        }}>
          theforge.app
        </div>
      </div>
    ),
    { ...size }
  );
}
