export default function SkeletonCard({ featured = false }: { featured?: boolean }) {
  return (
    <div className={`rounded-lg border border-border bg-surface overflow-hidden ${featured ? "rounded-xl" : ""}`}>
      <div className="flex">
        <div className="w-[3px] bg-border flex-shrink-0" />
        <div className={`flex-1 ${featured ? "p-6 sm:p-8" : "p-4 sm:p-5"}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-3 w-12 shimmer rounded" />
            <div className="h-4 w-16 shimmer rounded-full" />
          </div>
          <div className="space-y-2 mb-3">
            <div className={`shimmer rounded w-full ${featured ? "h-7" : "h-5"}`} />
            <div className={`shimmer rounded w-3/4 ${featured ? "h-7" : "h-5"}`} />
          </div>
          <div className="h-4 shimmer rounded w-full mb-1" />
          <div className="h-4 shimmer rounded w-2/3" />
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="h-3 w-10 shimmer rounded" />
              <div className="h-3 w-8 shimmer rounded" />
            </div>
            <div className="h-5 w-8 shimmer rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonFeed() {
  return (
    <div>
      <div className="mb-6">
        <SkeletonCard featured />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
