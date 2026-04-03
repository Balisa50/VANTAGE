"use client";

import { useState, useEffect } from "react";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isBreaking(dateStr: string): boolean {
  const hours =
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
  return hours < 3;
}

export default function LiveTimestamp({ date }: { date: string }) {
  const [display, setDisplay] = useState(timeAgo(date));
  const [breaking, setBreaking] = useState(isBreaking(date));

  useEffect(() => {
    setDisplay(timeAgo(date));
    setBreaking(isBreaking(date));

    const interval = setInterval(() => {
      setDisplay(timeAgo(date));
      setBreaking(isBreaking(date));
    }, 60_000);

    return () => clearInterval(interval);
  }, [date]);

  return (
    <span className="inline-flex items-center gap-2">
      {breaking && (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-accent-red/15 text-accent-red border border-accent-red/20">
          <span className="w-1 h-1 rounded-full bg-accent-red pulse-dot" />
          Breaking
        </span>
      )}
      <time className="text-text-secondary font-mono" dateTime={date}>
        {display}
      </time>
    </span>
  );
}
