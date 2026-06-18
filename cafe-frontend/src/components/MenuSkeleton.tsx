/*
  Skeleton loader — shows the same layout as real content while data loads.
  Prevents jarring empty → full flash and communicates something is happening.
  Shimmer animation done in pure Tailwind (animate-pulse).
*/
function SkeletonCard() {
  return (
    <div className="flex gap-3 bg-surface rounded-xl p-3 shadow-card animate-pulse">
      <div className="w-24 h-24 rounded-lg bg-line flex-shrink-0" />
      <div className="flex-1 flex flex-col justify-between py-1">
        <div className="space-y-2">
          <div className="h-3 bg-line rounded w-3/4" />
          <div className="h-3 bg-line rounded w-1/2" />
          <div className="h-3 bg-line rounded w-2/3" />
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="h-4 bg-line rounded w-10" />
          <div className="h-8 w-20 bg-line rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function MenuSkeleton() {
  return (
    <div className="px-4 py-3 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
