export default function SignalScore({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-accent-red"
      : score >= 40
        ? "bg-accent-amber"
        : "bg-accent-green";

  const label =
    score >= 70 ? "High Signal" : score >= 40 ? "Notable" : "Routine";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-mono text-text-secondary whitespace-nowrap">
        {score} — {label}
      </span>
    </div>
  );
}
