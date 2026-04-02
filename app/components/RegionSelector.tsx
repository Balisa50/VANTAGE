"use client";

const REGIONS = [
  { key: "all", label: "All Regions", emoji: "🌐" },
  { key: "global", label: "Global", emoji: "🌍" },
  { key: "africa", label: "Africa", emoji: "🌍" },
  { key: "asia", label: "Asia", emoji: "🌏" },
  { key: "europe", label: "Europe", emoji: "🌍" },
  { key: "americas", label: "Americas", emoji: "🌎" },
  { key: "middleeast", label: "Middle East", emoji: "🌍" },
];

export default function RegionSelector({
  active,
  onChange,
}: {
  active: string;
  onChange: (region: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {REGIONS.map((r) => (
        <button
          key={r.key}
          onClick={() => onChange(r.key)}
          className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-colors ${
            active === r.key
              ? "bg-accent-amber/15 text-accent-amber border-accent-amber/30"
              : "text-text-secondary border-border hover:border-accent-amber/20 hover:text-text-primary"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
