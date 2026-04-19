"use client";

import { useState } from "react";
import { Share2, Copy, CheckCheck } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://theforge.app";

interface Props {
  certTitle: string;
  verifyCode: string;
  passRate: number;
  totalTasks: number;
  totalHours: number;
}

export default function CertShareButton({ certTitle, verifyCode, passRate, totalTasks, totalHours }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const verifyUrl = `${BASE_URL}/verify/cert/${verifyCode}`;
  const pct = Math.round(passRate * 100);

  const shareText = `I just earned a verified certificate on The Forge ⚡\n\n📜 ${certTitle}\n✅ ${totalTasks} tasks · ${totalHours.toFixed(0)}h · ${pct}% pass rate\n\nEvery task was interrogation-verified by AI — no self-reporting.\n\nVerify it: ${verifyUrl}`;

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: "6px", padding: "0.5rem 1rem",
            cursor: "pointer", color: "var(--accent)",
            fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.875rem",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.06)"; }}
        >
          <Share2 size={14} />
          Share Certificate
        </button>
      ) : (
        <div style={{
          background: "rgba(245,158,11,0.04)",
          border: "1px solid rgba(245,158,11,0.15)",
          borderRadius: "10px",
          padding: "1.25rem",
        }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "0.625rem",
            color: "var(--accent)", letterSpacing: "0.15em",
            textTransform: "uppercase", marginBottom: "0.75rem",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <Share2 size={11} /> Share Your Certificate
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}
            >
              ✕
            </button>
          </div>

          {/* Preview text */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "6px", padding: "0.875rem",
            fontFamily: "var(--font-body)", fontSize: "0.8125rem",
            color: "var(--text-secondary)", lineHeight: 1.7,
            marginBottom: "0.875rem", whiteSpace: "pre-wrap",
          }}>
            {shareText}
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                padding: "0.625rem",
                background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "6px", textDecoration: "none",
                color: "var(--text-primary)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.875rem",
                transition: "background 0.15s",
              }}
            >
              Post on X / Twitter
            </a>
            <button
              onClick={handleCopy}
              style={{
                display: "flex", alignItems: "center", gap: "0.375rem",
                padding: "0.625rem 1rem",
                background: copied ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
                border: copied ? "1px solid var(--green)" : "1px solid var(--border)",
                borderRadius: "6px", cursor: "pointer",
                color: copied ? "var(--green)" : "var(--text-secondary)",
                fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.875rem",
                transition: "all 0.2s",
              }}
            >
              {copied ? <><CheckCheck size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
