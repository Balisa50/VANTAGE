"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Swords, Clock, TrendingDown, Shield, FlaskConical, CalendarDays, CalendarCheck, CalendarRange, Building2, UserCheck, User, ArrowRight, GraduationCap, Video, Target, AlertTriangle, Search, ExternalLink } from "lucide-react";
import { ROADMAPSH_PATHS, ROADMAPSH_CATEGORIES, type RoadmapShPath } from "@/lib/roadmapsh-paths";

type UserRole = "learner" | "student" | "mentor" | "bootcamp";

/**
 * Steps vary by role:
 *   Learner/Student:           role → intro → roadmap → schedule → consequences → contract
 *   Mentor (also learning):    role → intro → mentorLearn → roadmap → schedule → consequences → contract
 *   Mentor (mentor only):      role → intro → mentorLearn → consequences → contract
 *   Bootcamp:                  role → intro → consequences → contract
 */
function getStepsForRole(role: UserRole | null, isAlsoLearning: boolean) {
  if (role === "bootcamp") {
    return ["role", "intro", "consequences", "contract"] as const;
  }
  if (role === "mentor") {
    if (isAlsoLearning) {
      return ["role", "intro", "mentorLearn", "roadmap", "schedule", "deadline", "consequences", "contract"] as const;
    }
    return ["role", "intro", "mentorLearn", "consequences", "contract"] as const;
  }
  return ["role", "intro", "roadmap", "schedule", "deadline", "consequences", "contract"] as const;
}

const ROLES = [
  {
    id: "learner" as UserRole,
    Icon: User,
    title: "Solo Learner",
    desc: "I'm learning on my own. Hold me accountable.",
    color: "var(--accent)",
  },
  {
    id: "student" as UserRole,
    Icon: GraduationCap,
    title: "Student",
    desc: "I'm part of a bootcamp, school, or mentored group. I have an invite code.",
    color: "var(--green)",
  },
  {
    id: "mentor" as UserRole,
    Icon: UserCheck,
    title: "Mentor",
    desc: "I'm guiding students. I want to track their progress and verify their work.",
    color: "var(--blue)",
  },
  {
    id: "bootcamp" as UserRole,
    Icon: Building2,
    title: "Bootcamp / School Admin",
    desc: "I run a program. I need to create an organization, set deadlines, and manage cohorts.",
    color: "var(--orange, #ff7c3a)",
  },
];

const SCHEDULES = [
  { id: "daily", Icon: CalendarDays, title: "Every Day", desc: "Check in daily. Maximum accountability.", commitDays: [0, 1, 2, 3, 4, 5, 6] },
  { id: "weekday", Icon: CalendarCheck, title: "Weekdays Only", desc: "Monday through Friday. Weekends off.", commitDays: [1, 2, 3, 4, 5] },
  { id: "custom", Icon: CalendarRange, title: "Custom Days", desc: "Pick which days you commit to.", commitDays: [] },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function OnboardingPage() {
  const { update: updateSession } = useSession();
  const [step, setStep] = useState<string>("role");
  const [role, setRole] = useState<UserRole | null>(null);
  const [isAlsoLearning, setIsAlsoLearning] = useState(false);
  const [roadmapTitle, setRoadmapTitle] = useState("");
  const [selectedPath, setSelectedPath] = useState<RoadmapShPath | null>(null);
  const [pathSearch, setPathSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [journeyType, setJourneyType] = useState<"learn" | "project">("learn");
  const [scheduleId, setScheduleId] = useState("daily");
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");

  // Org creation fields (for bootcamp role)
  const [orgName, setOrgName] = useState("");
  const [orgDesc, setOrgDesc] = useState("");

  // Invite code (for mentor/student joining existing org)
  const [inviteCode, setInviteCode] = useState("");
  const [orgError, setOrgError] = useState("");

  const selectedSchedule = SCHEDULES.find((s) => s.id === scheduleId)!;
  const commitDays = scheduleId === "custom" ? customDays : selectedSchedule.commitDays;

  // Steps depend on role + mentor learning preference
  const steps = getStepsForRole(role, isAlsoLearning);
  const currentIndex = (steps as readonly string[]).indexOf(step);
  const needsRoadmap = role === "learner" || role === "student" || (role === "mentor" && isAlsoLearning);

  const toggleDay = (day: number) => {
    setCustomDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const handleRoleSelect = (r: UserRole) => {
    setRole(r);
    setStep("intro");
  };

  // Navigate to next step in the role-specific flow
  const nextStep = () => {
    const idx = (steps as readonly string[]).indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  };

  const prevStep = () => {
    const idx = (steps as readonly string[]).indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
  };

  const createOrgIfNeeded = async () => {
    setOrgError("");

    // Bootcamp admin: create a new organization
    if (role === "bootcamp" && orgName.trim()) {
      const res = await fetch("/api/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName.trim(), description: orgDesc.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setOrgError(data.error ?? "Failed to create organization.");
        return false;
      }
    }

    // Student: join org via invite code (required)
    if (role === "student" && inviteCode.trim()) {
      const res = await fetch("/api/org/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setOrgError(data.error ?? "Invalid invite code. Ask your bootcamp or mentor for a valid code.");
        return false;
      }
    }

    // Mentor: optionally join org via invite code (joins directly as mentor)
    if (role === "mentor" && inviteCode.trim()) {
      const res = await fetch("/api/org/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim(), joinAs: "mentor" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setOrgError(data.error ?? "Invalid invite code.");
        return false;
      }
    }

    return true;
  };

  const handleComplete = async () => {
    if (!agreed || !role) return;
    setLoading(true);
    setError("");

    try {
      // Create org first if needed
      if (role !== "learner") {
        const success = await createOrgIfNeeded();
        if (!success) { setLoading(false); return; }
      }

      // Generate AI-powered roadmap for learners, students, and mentors who learn
      if (needsRoadmap) {
        const title = selectedPath ? selectedPath.title : (roadmapTitle.trim() || "My Learning Journey");
        const mode = scheduleId === "custom" ? "custom" : scheduleId === "weekday" ? "weekday" : "daily";
        setLoadingMessage(selectedPath
          ? `Building your ${title} roadmap from roadmap.sh...`
          : journeyType === "project"
            ? "Breaking your project into milestones..."
            : "Generating your personalized curriculum..."
        );
        const res = await fetch("/api/roadmaps/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            mode,
            commitDays,
            type: selectedPath ? "learn" : journeyType,
            targetDate: targetDate || undefined,
            roadmapshId: selectedPath?.id ?? undefined,
            roadmapshDescription: selectedPath?.description ?? undefined,
          }),
        });
        // generate route uses streaming response (always HTTP 200) — check body for errors too
        const resData = await res.json().catch(() => ({}));
        if (!res.ok || resData.error) {
          console.error("[ONBOARDING] AI roadmap failed:", res.status, resData);
          // Fallback to static roadmap if AI fails
          const fallbackRes = await fetch("/api/roadmaps", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, mode, commitDays }),
          });
          if (!fallbackRes.ok) {
            setError("Failed to create roadmap. Please try again.");
            setLoading(false);
            setLoadingMessage("");
            return;
          }
        }
        setLoadingMessage("");
      }

      // Save role + mark onboarding complete
      const onboardRes = await fetch("/api/user/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, isAlsoLearning: role === "mentor" ? isAlsoLearning : false }),
      });

      if (!onboardRes.ok) {
        const errData = await onboardRes.json().catch(() => ({}));
        console.error("[ONBOARDING] Save failed:", onboardRes.status, errData);
        setError(errData.error || `Failed to save onboarding (${onboardRes.status}). Please try again.`);
        setLoading(false);
        return;
      }

      // Refresh the JWT so proxy knows onboarding is done
      await updateSession();

      // Use window.location (not router.push) to force full reload
      // This ensures the proxy picks up the updated JWT
      if (role === "bootcamp") {
        window.location.href = "/dashboard/org";
      } else if (role === "mentor") {
        window.location.href = "/dashboard/mentor";
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const canContinueSchedule = scheduleId !== "custom" || customDays.length >= 1;

  const scheduleText = needsRoadmap
    ? scheduleId === "daily"
      ? "every day"
      : scheduleId === "weekday"
        ? "every weekday"
        : `on my chosen days (${customDays.sort((a, b) => a - b).map((d) => DAY_NAMES[d]).join(", ")})`
    : "";

  const checkinDesc = scheduleId === "daily"
    ? "On each committed day, you must submit proof of work and pass an AI interrogation."
    : `On your committed days (${scheduleId === "weekday" ? "Mon-Fri" : "your chosen days"}), you must submit proof of work and pass an AI interrogation.`;

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: "640px" }}>
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} style={{ width: "8px", height: "8px", borderRadius: "50%", background: currentIndex >= i ? "var(--accent)" : "var(--border)", transition: "background 0.3s" }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ─── Step: Role Selection ──────────────────────────────── */}
          {step === "role" && (
            <motion.div key="role" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <div className="text-center" style={{ marginBottom: "2.5rem" }}>
                <h1 style={{ fontFamily: "var(--font-headline)", fontSize: "2.5rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>Who Are You?</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
                  This shapes your experience. You can always change it later.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleRoleSelect(r.id)}
                    className="forge-panel"
                    style={{
                      padding: "1.5rem",
                      textAlign: "left",
                      cursor: "pointer",
                      border: "1px solid var(--border)",
                      background: "var(--bg-panel)",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "1rem",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = r.color; e.currentTarget.style.boxShadow = `0 0 20px ${r.color}15`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "10px",
                      background: `${r.color}12`,
                      border: `1px solid ${r.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <r.Icon size={22} color={r.color} strokeWidth={1.5} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--font-headline)", fontSize: "1.125rem", marginBottom: "0.25rem" }}>{r.title}</div>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>{r.desc}</p>
                    </div>
                    <ArrowRight size={16} color="var(--text-dim)" style={{ marginTop: "0.25rem", flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── Step: Intro ──────────────────────────────────────── */}
          {step === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="text-center">
              <div style={{ marginBottom: "1rem", color: "var(--accent)", display: "flex", justifyContent: "center" }}><Flame size={56} strokeWidth={1.5} /></div>
              <h1 style={{ fontFamily: "var(--font-headline)", fontSize: "3rem", color: "var(--text-primary)", marginBottom: "1rem" }}>Welcome to The Forge</h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "1.0625rem", lineHeight: 1.8, maxWidth: "480px", margin: "0 auto 1.5rem" }}>
                {role === "bootcamp"
                  ? "Set up your organization. Your students and mentors will join using an invite code. You can create your own learning path later if you want."
                  : role === "mentor"
                    ? "You're here to guide others. Join an organization if you have an invite code, or mentor independently. You can optionally create your own learning path from the dashboard."
                    : role === "student"
                      ? "You're joining an organization. Enter your invite code below, then set up your learning path."
                      : "You're about to enter an accountability system that takes learning seriously. You set the pace. We hold you to it. No exceptions."
                }
              </p>

              {/* Proctoring notice for roles that take exams */}
              {(role === "learner" || role === "student") && (
                <div className="forge-card" style={{ padding: "1rem 1.25rem", display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "1.5rem", borderColor: "var(--blue)" }}>
                  <Video size={18} strokeWidth={1.5} style={{ color: "var(--blue)", flexShrink: 0, marginTop: "0.125rem" }} />
                  <div>
                    <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.25rem", color: "var(--blue)" }}>Camera Proctoring Enabled</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", lineHeight: 1.5 }}>
                      During exams, your camera will be active. AI monitors for: no person visible, multiple people, or looking away. This cannot be disabled.
                    </div>
                  </div>
                </div>
              )}

              {/* Org setup for bootcamp */}
              {role === "bootcamp" && (
                <div className="forge-panel" style={{ padding: "1.5rem", textAlign: "left", marginBottom: "1.5rem" }}>
                  <h3 style={{ fontFamily: "var(--font-headline)", fontSize: "1rem", marginBottom: "1rem" }}>Create Your Organization</h3>
                  <p style={{ color: "var(--text-dim)", fontSize: "0.8125rem", marginBottom: "1rem" }}>
                    Your students and mentors will join using an invite code generated after creation.
                  </p>
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      className="forge-input"
                      placeholder="Organization name (e.g. CodeCamp Africa)"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                    <input
                      type="text"
                      className="forge-input"
                      placeholder="Description (optional)"
                      value={orgDesc}
                      onChange={(e) => setOrgDesc(e.target.value)}
                    />
                    {orgError && <div style={{ color: "var(--red)", fontSize: "0.8125rem", fontFamily: "var(--font-mono)" }}>{orgError}</div>}
                  </div>
                </div>
              )}

              {/* Invite code for students */}
              {role === "student" && (
                <div className="forge-panel" style={{ padding: "1.5rem", textAlign: "left", marginBottom: "1.5rem" }}>
                  <h3 style={{ fontFamily: "var(--font-headline)", fontSize: "1rem", marginBottom: "0.5rem" }}>Join Your Organization</h3>
                  <p style={{ color: "var(--text-dim)", fontSize: "0.8125rem", marginBottom: "1rem" }}>
                    Enter the invite code your bootcamp or mentor gave you. You&apos;ll be added as a student with full accountability tracking.
                  </p>
                  <input
                    type="text"
                    className="forge-input"
                    placeholder="Enter invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.15em", textAlign: "center", fontSize: "1.25rem", padding: "1rem" }}
                  />
                  {orgError && <div style={{ color: "var(--red)", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", marginTop: "0.5rem" }}>{orgError}</div>}
                </div>
              )}

              {/* Invite code for mentors */}
              {role === "mentor" && (
                <div className="forge-panel" style={{ padding: "1.5rem", textAlign: "left", marginBottom: "1.5rem" }}>
                  <h3 style={{ fontFamily: "var(--font-headline)", fontSize: "1rem", marginBottom: "0.5rem" }}>Join an Organization</h3>
                  <p style={{ color: "var(--text-dim)", fontSize: "0.8125rem", marginBottom: "1rem" }}>
                    If your bootcamp gave you an invite code, enter it here. You&apos;ll be added as a mentor who can view student progress and pair with mentees. Or leave blank to mentor independently.
                  </p>
                  <input
                    type="text"
                    className="forge-input"
                    placeholder="Invite code (optional)"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
                  />
                  {orgError && <div style={{ color: "var(--red)", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", marginTop: "0.5rem" }}>{orgError}</div>}
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button onClick={() => setStep("role")} className="forge-btn forge-btn-ghost">Back</button>
                <button
                  onClick={nextStep}
                  className="forge-btn forge-btn-primary"
                  style={{ padding: "0.875rem 2.5rem", fontSize: "1rem" }}
                  disabled={(role === "bootcamp" && !orgName.trim()) || (role === "student" && !inviteCode.trim())}
                >
                  {role === "learner" ? "I'm Ready" : "Continue"}
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Step: Mentor Also Learning? ────────────────────────── */}
          {step === "mentorLearn" && role === "mentor" && (
            <motion.div key="mentorLearn" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <div className="text-center" style={{ marginBottom: "2.5rem" }}>
                <h1 style={{ fontFamily: "var(--font-headline)", fontSize: "2.5rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                  Are You Also Learning?
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", maxWidth: "480px", margin: "0 auto" }}>
                  Some mentors are also on their own learning journey. If that&apos;s you, we&apos;ll set up your roadmap and accountability too.
                </p>
              </div>

              <div className="flex flex-col gap-4 mb-6">
                <button
                  onClick={() => { setIsAlsoLearning(true); setStep("roadmap"); }}
                  className="forge-panel"
                  style={{
                    padding: "1.5rem", textAlign: "left", cursor: "pointer",
                    border: "1px solid var(--border)", background: "var(--bg-panel)",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    display: "flex", alignItems: "flex-start", gap: "1rem",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--green)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(34,197,94,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "10px",
                    background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <GraduationCap size={22} color="var(--green)" strokeWidth={1.5} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-headline)", fontSize: "1.125rem", marginBottom: "0.25rem" }}>Yes, I&apos;m Learning Too</div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                      I want my own roadmap, check-ins, and accountability — alongside mentoring.
                    </p>
                  </div>
                  <ArrowRight size={16} color="var(--text-dim)" style={{ marginTop: "0.25rem", flexShrink: 0 }} />
                </button>

                <button
                  onClick={() => { setIsAlsoLearning(false); setStep("consequences"); }}
                  className="forge-panel"
                  style={{
                    padding: "1.5rem", textAlign: "left", cursor: "pointer",
                    border: "1px solid var(--border)", background: "var(--bg-panel)",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    display: "flex", alignItems: "flex-start", gap: "1rem",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--blue)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(59,130,246,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "10px",
                    background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <UserCheck size={22} color="var(--blue)" strokeWidth={1.5} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-headline)", fontSize: "1.125rem", marginBottom: "0.25rem" }}>No, Just Mentoring</div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                      I only want to guide students — track their progress, review their work, hold them accountable.
                    </p>
                  </div>
                  <ArrowRight size={16} color="var(--text-dim)" style={{ marginTop: "0.25rem", flexShrink: 0 }} />
                </button>
              </div>

              <button onClick={prevStep} className="forge-btn forge-btn-ghost" style={{ width: "100%" }}>Back</button>
            </motion.div>
          )}

          {/* ─── Step: Roadmap browser ──────────────────────────────── */}
          {step === "roadmap" && needsRoadmap && (
            <RoadmapBrowser
              selectedPath={selectedPath}
              setSelectedPath={(p) => { setSelectedPath(p); if (p) setRoadmapTitle(""); }}
              pathSearch={pathSearch}
              setPathSearch={setPathSearch}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              roadmapTitle={roadmapTitle}
              setRoadmapTitle={(t) => { setRoadmapTitle(t); if (t) setSelectedPath(null); }}
              journeyType={journeyType}
              setJourneyType={setJourneyType}
              onBack={prevStep}
              onNext={nextStep}
            />
          )}

          {/* ─── Step: Schedule (Learner + Student only) ────────────── */}
          {step === "schedule" && needsRoadmap && (
            <motion.div key="schedule" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "2rem", marginBottom: "0.5rem" }}>Set Your Schedule</h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.9375rem" }}>How often will you commit to checking in? You can change this later.</p>

              <div className="flex flex-col gap-3 mb-4">
                {SCHEDULES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setScheduleId(s.id)}
                    className="forge-card"
                    style={{
                      padding: "1rem 1.25rem", textAlign: "left", width: "100%", cursor: "pointer",
                      border: scheduleId === s.id ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: scheduleId === s.id ? "rgba(245,158,11,0.05)" : "var(--bg-card)",
                      transition: "all 0.15s",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <s.Icon size={20} strokeWidth={1.5} style={{ color: scheduleId === s.id ? "var(--accent)" : "var(--text-dim)", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontFamily: "var(--font-headline)", fontSize: "1.0625rem", letterSpacing: "0.05em" }}>{s.title}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", marginTop: "0.125rem" }}>{s.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {scheduleId === "custom" && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", marginBottom: "0.75rem" }}>Select at least 1 day:</p>
                  <div className="flex gap-2 flex-wrap">
                    {DAY_NAMES.map((name, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleDay(i)}
                        style={{
                          padding: "0.5rem 0.875rem", borderRadius: "6px", cursor: "pointer",
                          fontFamily: "var(--font-mono)", fontSize: "0.8125rem", fontWeight: 600,
                          border: customDays.includes(i) ? "1px solid var(--accent)" : "1px solid var(--border)",
                          background: customDays.includes(i) ? "rgba(245,158,11,0.1)" : "transparent",
                          color: customDays.includes(i) ? "var(--accent)" : "var(--text-secondary)",
                          transition: "all 0.15s",
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={prevStep} className="forge-btn forge-btn-ghost" style={{ flex: 1 }}>Back</button>
                <button
                  onClick={nextStep}
                  className="forge-btn forge-btn-primary"
                  style={{ flex: 2 }}
                  disabled={!canContinueSchedule}
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Step: Deadline ────────────────────────────────────── */}
          {step === "deadline" && needsRoadmap && (
            <motion.div key="deadline" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <div style={{ color: "var(--accent)", display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                <Target size={48} strokeWidth={1.5} />
              </div>
              <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "2rem", marginBottom: "0.5rem", textAlign: "center" }}>Set Your Deadline</h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.9375rem", textAlign: "center", maxWidth: "440px", margin: "0 auto 2rem" }}>
                When do you want to finish? A deadline keeps you honest. The Forge will calculate your pace and warn you if you fall behind.
              </p>

              <div className="forge-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.5rem", display: "block" }}>
                  Target Completion Date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                  className="forge-input"
                  style={{ fontSize: "1.125rem", padding: "0.875rem 1rem", textAlign: "center", fontFamily: "var(--font-mono)" }}
                />
                {targetDate && (
                  <div style={{ marginTop: "0.75rem", textAlign: "center" }}>
                    {(() => {
                      const days = Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      const weeks = Math.round(days / 7);
                      return (
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "0.9375rem", color: days < 14 ? "var(--red)" : days < 30 ? "var(--yellow)" : "var(--green)" }}>
                          {days} days ({weeks} weeks) from now
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => { setTargetDate(""); nextStep(); }}
                style={{ width: "100%", textAlign: "center", color: "var(--text-dim)", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", background: "none", border: "none", cursor: "pointer", marginBottom: "1.5rem", padding: "0.5rem" }}
              >
                Skip — I&apos;ll set a deadline later
              </button>

              <div className="flex gap-3">
                <button onClick={prevStep} className="forge-btn forge-btn-ghost" style={{ flex: 1 }}>Back</button>
                <button
                  onClick={nextStep}
                  className="forge-btn forge-btn-primary"
                  style={{ flex: 2 }}
                >
                  {targetDate ? "Lock It In" : "Continue"}
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Step: Consequences ───────────────────────────────── */}
          {step === "consequences" && (
            <motion.div key="consequences" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "2rem", marginBottom: "0.5rem", color: "var(--red)" }}>
                {needsRoadmap ? "Read This Carefully" : "How It Works"}
              </h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.9375rem" }}>
                {needsRoadmap
                  ? "These are the consequences of failing. They are real and cannot be disabled."
                  : role === "mentor"
                    ? "Your students will face these consequences. As their mentor, you should understand them."
                    : "Your students will face these consequences. As the admin, you enforce this system."
                }
              </p>

              <div className="flex flex-col gap-3 mb-6">
                {([
                  { Icon: Clock, title: "Submit Real Proof", desc: needsRoadmap ? "Every committed day you submit a live GitHub repo or deployed URL. The system verifies it exists, is not empty, and was recently updated. No fake links." : "Students submit a verified GitHub repo or live URL every committed day. The system checks it's real — no fake links pass.", color: "var(--red)" },
                  { Icon: FlaskConical, title: "AI Interrogation", desc: "3 open-ended questions about what you built and why. Minimum 40% to pass. No multiple choice — you explain your work in your own words. The AI grades your understanding, not your grammar.", color: "var(--green)" },
                  { Icon: Flame, title: "Grace Days", desc: "5 grace days per month. Miss a committed day for any reason — use a grace day. No penalty, no questions. They reset every month. Use them wisely.", color: "var(--accent)" },
                  { Icon: Shield, title: "Integrity Only Goes Up", desc: "Your integrity score starts at 0 and only increases — through clean check-ins, perfect defences, helping peers, and explaining your work in your own words. No surveillance, no deductions.", color: "var(--blue)" },
                  { Icon: AlertTriangle, title: "Respite", desc: "Up to 5 respites. Life happens — use a Respite to pause your roadmap for a few days without falling behind. Useful for emergencies, travel, or just breathing. Not a cheat code.", color: "var(--yellow)" },
                  { Icon: TrendingDown, title: "Verified Certificate", desc: "Complete your roadmap and earn a cryptographically verified certificate with your pass rate, hours logged, and task count. Shareable with employers. Cannot be faked.", color: "var(--green)" },
                ] as const).map((item) => (
                  <div key={item.title} className="forge-card" style={{ padding: "0.875rem 1.125rem", display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
                    <item.Icon size={18} strokeWidth={2} style={{ color: item.color, flexShrink: 0, marginTop: "0.15rem" }} />
                    <div>
                      <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.25rem" }}>{item.title}</div>
                      <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={prevStep} className="forge-btn forge-btn-ghost" style={{ flex: 1 }}>Back</button>
                <button onClick={nextStep} className="forge-btn forge-btn-primary" style={{ flex: 2 }}>I Understand</button>
              </div>
            </motion.div>
          )}

          {/* ─── Step: Contract ───────────────────────────────────── */}
          {step === "contract" && (
            <motion.div key="contract" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="text-center">
              <div style={{ marginBottom: "1rem", color: "var(--accent)", display: "flex", justifyContent: "center" }}><Swords size={56} strokeWidth={1.5} /></div>
              <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "2.5rem", marginBottom: "1rem" }}>The Contract</h2>
              <div className="forge-panel" style={{ padding: "1.5rem", textAlign: "left", marginBottom: "2rem" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.8 }}>
                  {role === "mentor" && !isAlsoLearning
                    ? "I commit to guiding my mentees with integrity. I will review their work honestly, hold them to the standard, and never let them slide. I am here to forge, not to coddle."
                    : role === "mentor" && isAlsoLearning
                      ? <>I commit to guiding my mentees with integrity while also holding myself accountable. I will show up {scheduleText}, complete my check-ins honestly, and face the consequences when I fail. I mentor and I learn — no exceptions.</>
                    : role === "bootcamp"
                      ? "I commit to running my organization with integrity. I will hold my students to the standard, enforce the consequences, and lead by example. The Forge is not a game — it's a system that works because we don't bend."
                      : <>I commit to showing up {scheduleText}. I will complete my check-ins honestly. I will face the consequences when I fail. I will not cheat, skip, or make excuses. I am here to be forged, not coddled.{role === "student" && " As a student in my organization, I will show up, do the work, and prove it."}</>
                  }
                </p>
              </div>

              {error && (
                <div style={{ background: "rgba(255,45,45,0.1)", border: "1px solid var(--red)", borderRadius: "4px", padding: "0.75rem 1rem", marginBottom: "1.5rem", color: "var(--red)", fontSize: "0.875rem" }}>
                  {error}
                </div>
              )}

              <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "center", cursor: "pointer", marginBottom: "2rem" }}>
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: "18px", height: "18px", accentColor: "var(--accent)", cursor: "pointer" }} />
                <span style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)", fontWeight: 600 }}>I commit to this</span>
              </label>

              <div className="flex gap-3">
                <button onClick={prevStep} className="forge-btn forge-btn-ghost" style={{ flex: 1 }}>Back</button>
                <button onClick={handleComplete} className="forge-btn forge-btn-primary" style={{ flex: 2 }} disabled={!agreed || loading}>
                  {loading
                    ? (loadingMessage ? "Generating Roadmap..." : "Forging...")
                    : role === "mentor"
                      ? "START MENTORING"
                      : role === "bootcamp"
                        ? "LAUNCH ORGANIZATION"
                        : "FORGE MY PATH"
                  }
                </button>
              </div>

              {loading && loadingMessage && (
                <div style={{
                  marginTop: "1.5rem",
                  padding: "1.25rem",
                  background: "rgba(245,158,11,0.06)",
                  border: "1px solid rgba(245,158,11,0.15)",
                  borderRadius: "10px",
                  textAlign: "center",
                }}>
                  <div style={{
                    width: "32px", height: "32px", margin: "0 auto 0.75rem",
                    border: "3px solid var(--border)", borderTopColor: "var(--accent)",
                    borderRadius: "50%", animation: "spin 0.8s linear infinite",
                  }} />
                  <p style={{ color: "var(--accent)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.9375rem", marginBottom: "0.25rem" }}>
                    {loadingMessage}
                  </p>
                  <p style={{ color: "var(--text-dim)", fontSize: "0.8125rem" }}>
                    This takes 15-30 seconds. The AI is building something great.
                  </p>
                </div>
              )}
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Roadmap Browser sub-component ──────────────────────────────────────────

interface RoadmapBrowserProps {
  selectedPath: RoadmapShPath | null;
  setSelectedPath: (p: RoadmapShPath | null) => void;
  pathSearch: string;
  setPathSearch: (s: string) => void;
  activeCategory: string;
  setActiveCategory: (c: string) => void;
  roadmapTitle: string;
  setRoadmapTitle: (t: string) => void;
  journeyType: "learn" | "project";
  setJourneyType: (t: "learn" | "project") => void;
  onBack: () => void;
  onNext: () => void;
}

function RoadmapBrowser({
  selectedPath, setSelectedPath,
  pathSearch, setPathSearch,
  activeCategory, setActiveCategory,
  roadmapTitle, setRoadmapTitle,
  journeyType, setJourneyType,
  onBack, onNext,
}: RoadmapBrowserProps) {
  const filtered = useMemo(() => {
    const q = pathSearch.toLowerCase();
    return ROADMAPSH_PATHS.filter((p) => {
      const matchCat = activeCategory === "all" || p.category === activeCategory;
      const matchQ = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [pathSearch, activeCategory]);

  const canContinue = !!(selectedPath || roadmapTitle.trim());

  return (
    <motion.div key="roadmap" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
      <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "2rem", marginBottom: "0.25rem" }}>
        Choose Your Path
      </h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", fontSize: "0.9375rem" }}>
        Pick a roadmap.sh path — or describe your own below.
      </p>

      {/* Selected path badge */}
      {selectedPath && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1.125rem", marginBottom: "1rem", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "10px" }}>
          <span style={{ fontSize: "1.5rem" }}>{selectedPath.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-headline)", fontSize: "1rem" }}>{selectedPath.title}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-dim)" }}>roadmap.sh/{selectedPath.slug} · ~{selectedPath.estimatedWeeks} weeks</div>
          </div>
          <a href={`https://roadmap.sh/${selectedPath.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-dim)", padding: "0.25rem" }}>
            <ExternalLink size={14} />
          </a>
          <button onClick={() => setSelectedPath(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", fontSize: "1.125rem", padding: "0.25rem" }}>×</button>
        </div>
      )}

      {/* Search + category filter */}
      <div style={{ position: "relative", marginBottom: "0.75rem" }}>
        <Search size={15} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
        <input
          type="text"
          value={pathSearch}
          onChange={(e) => setPathSearch(e.target.value)}
          className="forge-input"
          placeholder="Search paths..."
          style={{ paddingLeft: "2.5rem" }}
        />
      </div>

      <div className="flex gap-2 flex-wrap mb-3">
        {["all", ...ROADMAPSH_CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: "0.25rem 0.75rem", borderRadius: "20px", cursor: "pointer", fontSize: "0.75rem",
              fontFamily: "var(--font-mono)", letterSpacing: "0.05em", textTransform: "uppercase",
              border: activeCategory === cat ? "1px solid var(--accent)" : "1px solid var(--border)",
              background: activeCategory === cat ? "rgba(245,158,11,0.1)" : "transparent",
              color: activeCategory === cat ? "var(--accent)" : "var(--text-dim)",
              transition: "all 0.15s",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Path grid */}
      <div style={{ maxHeight: "260px", overflowY: "auto", marginBottom: "1.25rem", paddingRight: "4px" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-dim)", fontSize: "0.875rem" }}>
            No paths match &ldquo;{pathSearch}&rdquo;
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {filtered.map((path) => (
              <button
                key={path.id}
                type="button"
                onClick={() => setSelectedPath(selectedPath?.id === path.id ? null : path)}
                style={{
                  padding: "0.75rem", borderRadius: "8px", textAlign: "left", cursor: "pointer",
                  border: selectedPath?.id === path.id ? "1px solid var(--accent)" : "1px solid var(--border)",
                  background: selectedPath?.id === path.id ? "rgba(245,158,11,0.07)" : "var(--bg-card)",
                  transition: "all 0.12s",
                  display: "flex", alignItems: "flex-start", gap: "0.5rem",
                }}
              >
                <span style={{ fontSize: "1.25rem", flexShrink: 0, lineHeight: 1 }}>{path.emoji}</span>
                <div>
                  <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.125rem", color: selectedPath?.id === path.id ? "var(--accent)" : "var(--text-primary)" }}>{path.title}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "var(--text-dim)" }}>~{path.estimatedWeeks}w</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>or build your own</span>
        <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
      </div>

      {/* Type toggle (only visible for custom) */}
      {!selectedPath && (
        <div className="flex gap-3 mb-4">
          {([["learn", GraduationCap, "Learn a Skill"], ["project", Swords, "Ship a Project"]] as const).map(([t, Icon, label]) => (
            <button
              key={t}
              type="button"
              onClick={() => setJourneyType(t)}
              style={{
                flex: 1, padding: "0.75rem", borderRadius: "8px", cursor: "pointer",
                border: journeyType === t ? "1px solid var(--accent)" : "1px solid var(--border)",
                background: journeyType === t ? "rgba(245,158,11,0.06)" : "var(--bg-card)",
                textAlign: "center", transition: "all 0.15s",
              }}
            >
              <Icon size={20} strokeWidth={1.5} style={{ margin: "0 auto 0.375rem", display: "block", color: journeyType === t ? "var(--accent)" : "var(--text-dim)" }} />
              <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.875rem", color: journeyType === t ? "var(--accent)" : "var(--text-primary)" }}>{label}</div>
            </button>
          ))}
        </div>
      )}

      <input
        type="text"
        value={roadmapTitle}
        onChange={(e) => setRoadmapTitle(e.target.value)}
        className="forge-input"
        placeholder={journeyType === "project" ? "e.g. Build a SaaS MVP, Portfolio Website..." : "e.g. Machine Learning, Blockchain, Game Dev..."}
        style={{ marginBottom: "1.25rem" }}
        disabled={!!selectedPath}
      />

      <div className="flex gap-3">
        <button onClick={onBack} className="forge-btn forge-btn-ghost" style={{ flex: 1 }}>Back</button>
        <button onClick={onNext} className="forge-btn forge-btn-primary" style={{ flex: 2 }} disabled={!canContinue}>
          Continue
        </button>
      </div>
    </motion.div>
  );
}
