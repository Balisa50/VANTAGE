"use client";

const CATEGORIES = [
  "All",
  "AI",
  "Big Tech",
  "Startups",
  "Policy",
  "Markets",
  "Infrastructure",
];

export default function CategoryFilter({
  active,
  onChange,
}: {
  active: string;
  onChange: (cat: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-3 py-1.5 sm:px-4 rounded-full text-xs sm:text-sm font-mono transition-colors ${
            active === cat
              ? "bg-accent-amber text-background"
              : "bg-surface text-text-secondary hover:text-text-primary border border-border"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
