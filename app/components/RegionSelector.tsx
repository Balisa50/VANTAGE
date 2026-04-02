"use client";

const REGIONS = [
  { key: "all", label: "All Regions" },
  { key: "global", label: "Global" },
  { key: "africa", label: "Africa" },
  { key: "asia", label: "Asia" },
  { key: "europe", label: "Europe" },
  { key: "americas", label: "Americas" },
  { key: "middleeast", label: "Middle East" },
];

export default function RegionSelector({
  active,
  onChange,
}: {
  active: string;
  onChange: (region: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      {REGIONS.map((r) => (
        <button
          key={r.key}
          onClick={() => onChange(r.key)}
          className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-all duration-200 ${
            active === r.key
              ? "bg-accent-amber/10 text-accent-amber border-accent-amber/25"
              : "text-text-secondary border-border hover:border-accent-amber/15 hover:text-text-primary"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
