"use client";

import { useEffect } from "react";

export default function KeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "/") {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[placeholder="Search stories..."]'
        ) as HTMLInputElement | null;
        searchInput?.focus();
        return;
      }

      if (e.key === "j" || e.key === "k") {
        const cards = Array.from(
          document.querySelectorAll("article")
        ) as HTMLElement[];
        if (cards.length === 0) return;

        // Find which card is closest to viewport center
        const viewportCenter = window.innerHeight / 2;
        let closestIdx = 0;
        let closestDist = Infinity;

        cards.forEach((card, i) => {
          const rect = card.getBoundingClientRect();
          const cardCenter = rect.top + rect.height / 2;
          const dist = Math.abs(cardCenter - viewportCenter);
          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = i;
          }
        });

        const nextIdx = e.key === "j"
          ? Math.min(closestIdx + 1, cards.length - 1)
          : Math.max(closestIdx - 1, 0);

        cards[nextIdx].scrollIntoView({ behavior: "smooth", block: "center" });

        // Highlight briefly
        const link = cards[nextIdx].closest("a");
        if (link) {
          link.classList.add("ring-1", "ring-accent-amber/50");
          setTimeout(() => {
            link.classList.remove("ring-1", "ring-accent-amber/50");
          }, 1500);
        }
      }

      // Enter to open focused article
      if (e.key === "Enter") {
        const focused = document.querySelector(
          "a.ring-1"
        ) as HTMLAnchorElement | null;
        if (focused) {
          focused.click();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return null;
}
