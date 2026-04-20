"use client";

import { useState } from "react";
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
  BarChart3,
  Settings,
  LogOut,
  Building2,
  UserCheck,
  GraduationCap,
  User as UserIcon,
  Flame,
  Users,
  FolderOpen,
  Layers,
  Menu,
  X,
  Award,
} from "lucide-react";

interface DashboardNavProps {
  user: User;
  userRole: string;
  orgRole?: string | null;
  isAlsoLearning?: boolean;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  learner:  { label: "Solo Learner", color: "var(--accent)" },
  student:  { label: "Student",     color: "var(--green)" },
  mentor:   { label: "Mentor",      color: "var(--blue)" },
  bootcamp: { label: "Admin",       color: "var(--orange, #ff7c3a)" },
};

type NavItem = { href: string; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }> };

function getNavItems(userRole: string, isAlsoLearning: boolean): NavItem[] {
  switch (userRole) {
    case "learner":
      return [
        { href: "/dashboard",                   label: "Dashboard",     Icon: LayoutDashboard },
        { href: "/dashboard/checkin",            label: "Check In",      Icon: ClipboardCheck },
        { href: "/dashboard/roadmap",            label: "Roadmap",       Icon: Map },
        { href: "/dashboard/pod",               label: "My Pod",        Icon: Users },
        { href: "/dashboard/journal",            label: "Journal",       Icon: BookOpen },
        { href: "/dashboard/calendar",           label: "Calendar",      Icon: CalendarDays },
        { href: "/dashboard/analytics",          label: "Analytics",     Icon: BarChart3 },
        { href: "/dashboard/certificates",       label: "Certificates",  Icon: Award },
        { href: "/dashboard/settings",           label: "Settings",      Icon: Settings },
      ];

    case "student":
      return [
        { href: "/dashboard",                   label: "Dashboard",     Icon: LayoutDashboard },
        { href: "/dashboard/checkin",            label: "Check In",      Icon: ClipboardCheck },
        { href: "/dashboard/roadmap",            label: "Roadmap",       Icon: Map },
        { href: "/dashboard/pod",               label: "My Pod",        Icon: Users },
        { href: "/dashboard/journal",            label: "Journal",       Icon: BookOpen },
        { href: "/dashboard/calendar",           label: "Calendar",      Icon: CalendarDays },
        { href: "/dashboard/analytics",          label: "Analytics",     Icon: BarChart3 },
        { href: "/dashboard/certificates",       label: "Certificates",  Icon: Award },
        { href: "/dashboard/settings",           label: "Settings",      Icon: Settings },
      ];

    case "mentor":
      return isAlsoLearning
        ? [
            { href: "/dashboard",                 label: "Overview",      Icon: LayoutDashboard },
            { href: "/dashboard/mentor",           label: "My Mentees",    Icon: Users },
            { href: "/dashboard/checkin",          label: "Check In",      Icon: ClipboardCheck },
            { href: "/dashboard/roadmap",          label: "Roadmap",       Icon: Map },
            { href: "/dashboard/pod",             label: "My Pod",        Icon: Users },
            { href: "/dashboard/journal",          label: "Journal",       Icon: BookOpen },
            { href: "/dashboard/calendar",         label: "Calendar",      Icon: CalendarDays },
            { href: "/dashboard/analytics",        label: "Analytics",     Icon: BarChart3 },
            { href: "/dashboard/certificates",     label: "Certificates",  Icon: Award },
            { href: "/dashboard/settings",         label: "Settings",      Icon: Settings },
          ]
        : [
            { href: "/dashboard/mentor",     label: "Overview",     Icon: LayoutDashboard },
            { href: "/dashboard/settings",   label: "Settings",     Icon: Settings },
          ];

    case "bootcamp":
      return [
        { href: "/dashboard/org",            label: "Overview",      Icon: LayoutDashboard },
        { href: "/dashboard/org/students",   label: "Students",      Icon: GraduationCap },
        { href: "/dashboard/org/mentors",    label: "Mentors",       Icon: UserCheck },
        { href: "/dashboard/org/cohorts",    label: "Cohorts",       Icon: Layers },
        { href: "/dashboard/org/resources",  label: "Resources",     Icon: FolderOpen },
        { href: "/dashboard/settings",       label: "Settings",      Icon: Settings },
      ];

    default:
      return [
        { href: "/dashboard",           label: "Dashboard",   Icon: LayoutDashboard },
        { href: "/dashboard/settings",   label: "Settings",    Icon: Settings },
      ];
  }
}

export default function DashboardNav({ user, userRole, orgRole, isAlsoLearning = false }: DashboardNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const NAV_ITEMS = getNavItems(userRole, isAlsoLearning);
  const roleInfo = ROLE_LABELS[userRole] ?? ROLE_LABELS.learner;

  const closeMobile = () => setMobileOpen(false);

  const navContent = (
    <>
      {/* Logo */}
      <div style={{ padding: "0 1.5rem", marginBottom: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }} onClick={closeMobile}>
          <span
            style={{
              fontFamily: "var(--font-headline)",
              color: "var(--accent)",
              fontSize: "1.375rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Flame size={20} /> THE FORGE
          </span>
        </Link>
        {/* Close button on mobile */}
        <button
          onClick={closeMobile}
          className="nav-close-btn"
          style={{
            display: "none",
            background: "none",
            border: "none",
            color: "var(--text-dim)",
            cursor: "pointer",
            padding: "0.25rem",
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-0.5 px-3" style={{ flex: 1, overflowY: "auto" }}>
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={closeMobile}
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

      {/* User + Role + Sign Out */}
      <div style={{ padding: "1.25rem 1.5rem 0", borderTop: "1px solid var(--border)" }}>
        <div style={{ marginBottom: "0.75rem" }}>
          <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user.name}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user.email}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: "0.375rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span style={{ color: roleInfo.color, display: "flex", alignItems: "center", gap: "0.25rem" }}>
              {userRole === "student" && <GraduationCap size={10} />}
              {userRole === "mentor" && <UserCheck size={10} />}
              {userRole === "bootcamp" && <Building2 size={10} />}
              {userRole === "learner" && <UserIcon size={10} />}
              {roleInfo.label}
            </span>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          style={{
            display: "flex", alignItems: "center", gap: "0.375rem",
            fontFamily: "var(--font-body)", fontWeight: 500, fontSize: "0.8125rem",
            color: "var(--text-dim)", background: "none", border: "none",
            cursor: "pointer", padding: 0, transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-dim)")}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="nav-hamburger dashboard-hamburger"
        aria-label="Open navigation"
        style={{
          display: "none",
          position: "fixed",
          top: "1rem",
          left: "1rem",
          zIndex: 50,
          background: "var(--bg-panel)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "0.5rem",
          cursor: "pointer",
          color: "var(--text-primary)",
        }}
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          className="nav-overlay"
          style={{
            display: "none",
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 44,
          }}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`dashboard-sidebar ${mobileOpen ? "open" : ""}`}
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
          zIndex: 45,
          transition: "transform 0.25s ease",
        }}
      >
        {navContent}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .nav-hamburger { display: block !important; }
          .nav-overlay { display: block !important; }
          .nav-close-btn { display: block !important; }
          .dashboard-sidebar {
            transform: translateX(-100%);
          }
          .dashboard-sidebar.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
