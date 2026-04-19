export default function RoadmapLoading() {
  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="skeleton skeleton-title w-64" />
          <div className="skeleton skeleton-text w-44" />
        </div>
        <div className="skeleton h-10 w-36 rounded-lg" />
      </div>

      {/* Overall progress bar */}
      <div className="forge-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="skeleton skeleton-text w-32" />
          <div className="skeleton skeleton-text w-16" />
        </div>
        <div className="h-2 rounded-full bg-[var(--bg-card)] overflow-hidden">
          <div className="skeleton h-full w-2/5 rounded-full" />
        </div>
      </div>

      {/* Track cards */}
      {[0, 1, 2].map((i) => (
        <div key={i} className="forge-panel overflow-hidden">
          {/* Track header */}
          <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
            <div className="skeleton skeleton-circle w-8 h-8 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton skeleton-text" style={{ width: `${160 + i * 30}px` }} />
              <div className="skeleton skeleton-text w-28" />
            </div>
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>

          {/* Task rows */}
          <div className="divide-y divide-[var(--border)]">
            {[0, 1, 2].map((j) => (
              <div key={j} className="p-4 flex items-center gap-3">
                <div className="skeleton skeleton-circle w-5 h-5 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton skeleton-text" style={{ width: `${45 + (i + j) * 8}%` }} />
                  <div className="skeleton skeleton-text w-20" />
                </div>
                <div className="skeleton h-7 w-24 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
