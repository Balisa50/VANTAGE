import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getScoreColor(score: number) {
  if (score >= 9) return "text-green-400";
  if (score >= 7) return "text-blue-400";
  if (score >= 5) return "text-yellow-400";
  return "text-red-400";
}

export function getGrade(score: number) {
  if (score >= 90) return { grade: "S", label: "FORGED IN FIRE", color: "text-yellow-400" };
  if (score >= 80) return { grade: "A", label: "EXCEPTIONAL", color: "text-green-400" };
  if (score >= 70) return { grade: "B", label: "STRONG", color: "text-blue-400" };
  if (score >= 60) return { grade: "C", label: "COMPETENT", color: "text-cyan-400" };
  if (score >= 50) return { grade: "D", label: "DEVELOPING", color: "text-yellow-600" };
  return { grade: "F", label: "INCOMPLETE", color: "text-red-400" };
}

export function getIntegrityBadge(score: number) {
  if (score >= 90) return { label: "PRISTINE", color: "text-green-400" };
  if (score >= 80) return { label: "GOOD", color: "text-blue-400" };
  if (score >= 50) return { label: "WARNED", color: "text-yellow-400" };
  if (score >= 40) return { label: "FLAGGED", color: "text-orange-400" };
  return { label: "RESTRICTED", color: "text-red-400" };
}
