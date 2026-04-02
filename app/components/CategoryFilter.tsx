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
          className={`px-3 py-1.5 sm:px-4 rounded-full text-xs sm:text-sm font-mono transition-all duration-200 ${
            active === cat
              ? "bg-accent-amber/10 text-accent-amber border border-accent-amber/20"
              : "text-text-secondary border border-border hover:text-text-primary hover:border-border-glow"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
