export default function SkeletonCard({ featured = false }: { featured?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden animate-pulse">
      <div className={`px-6 ${featured ? "py-10" : "py-6"}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-3 w-12 bg-border rounded" />
          <div className="h-3 w-16 bg-border rounded-full" />
        </div>
        <div
          className={`space-y-2 ${featured ? "mb-4" : "mb-3"}`}
        >
          <div className={`h-6 bg-border rounded w-full ${featured ? "h-8" : ""}`} />
          <div className={`h-6 bg-border rounded w-3/4 ${featured ? "h-8" : ""}`} />
        </div>
        <div className="h-4 bg-border rounded w-full" />
        <div className="h-4 bg-border rounded w-2/3 mt-1" />
      </div>
      <div className="px-6 py-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-3 w-10 bg-border rounded" />
            <div className="h-3 w-14 bg-border rounded" />
          </div>
          <div className="h-1 w-32 bg-border rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonFeed() {
  return (
    <div>
      <div className="mb-8">
        <SkeletonCard featured />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
