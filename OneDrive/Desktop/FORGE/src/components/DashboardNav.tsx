"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { type User } from "next-auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "⚡" },
  { href: "/dashboard/checkin", label: "Check In", icon: "🔬" },
  { href: "/dashboard/roadmap", label: "Roadmap", icon: "🗺️" },
  { href: "/dashboard/journal", label: "Journal", icon: "📖" },
  { href: "/dashboard/calendar", label: "Calendar", icon: "📅" },
];

export default function DashboardNav({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: "240px",
        background: "var(--bg-panel)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 0",
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "0 1.5rem", marginBottom: "2rem" }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", color: "var(--red)", fontSize: "1.5rem", letterSpacing: "0.1em" }}>
          THE FORGE
        </span>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-1 px-3" style={{ flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.625rem 0.875rem",
                borderRadius: "6px",
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                fontSize: "0.9375rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
                background: active ? "rgba(255,45,45,0.1)" : "transparent",
                borderLeft: active ? "2px solid var(--red)" : "2px solid transparent",
                transition: "all 0.15s",
                textDecoration: "none",
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* User + Sign Out */}
      <div style={{ padding: "0 1.5rem", borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
        <div style={{ marginBottom: "0.75rem" }}>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user.name}
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.6875rem", color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user.email}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.8125rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}
