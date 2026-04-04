"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { type User } from "next-auth";
import {
  LayoutDashboard,
  ClipboardCheck,
  Map,
  BookOpen,
  CalendarDays,
  Settings,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",           label: "Dashboard",  Icon: LayoutDashboard },
  { href: "/dashboard/checkin",   label: "Check In",   Icon: ClipboardCheck  },
  { href: "/dashboard/roadmap",   label: "Roadmap",    Icon: Map             },
  { href: "/dashboard/journal",   label: "Journal",    Icon: BookOpen        },
  { href: "/dashboard/calendar",  label: "Calendar",   Icon: CalendarDays    },
  { href: "/dashboard/settings",  label: "Settings",   Icon: Settings        },
];

export default function DashboardNav({ user }: { user: User }) {
  const pathname = usePathname();

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
        <span
          style={{
            fontFamily: "var(--font-headline)",
            color: "var(--accent)",
            fontSize: "1.375rem",
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}
        >
          The Forge
        </span>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-0.5 px-3" style={{ flex: 1 }}>
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "6px",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                fontSize: "0.875rem",
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
                background: active ? "rgba(245,158,11,0.08)" : "transparent",
                borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
                transition: "all 0.15s",
                textDecoration: "none",
              }}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </div>

      {/* User + Sign Out */}
      <div
        style={{
          padding: "1.25rem 1.5rem 0",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div style={{ marginBottom: "0.75rem" }}>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: "0.875rem",
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user.name}
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color: "var(--text-dim)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user.email}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            fontSize: "0.8125rem",
            color: "var(--text-dim)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-dim)")}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
