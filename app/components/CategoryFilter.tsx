"use client";

const CATEGORIES = [
  { key: "All", color: "text-accent-amber" },
  { key: "AI", color: "text-amber-400" },
  { key: "Big Tech", color: "text-purple-400" },
  { key: "Startups", color: "text-emerald-400" },
  { key: "Policy", color: "text-red-400" },
  { key: "Markets", color: "text-cyan-400" },
  { key: "Infrastructure", color: "text-blue-400" },
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
          key={cat.key}
          onClick={() => onChange(cat.key)}
          className={`px-3 py-1.5 sm:px-4 rounded-full text-xs sm:text-sm font-mono transition-all duration-200 ${
            active === cat.key
              ? `bg-surface-elevated ${cat.color} border border-current/20 shadow-sm`
              : "text-text-secondary border border-border hover:border-border-glow hover:text-text-primary"
          }`}
        >
          {cat.key}
        </button>
      ))}
    </div>
  );
}
