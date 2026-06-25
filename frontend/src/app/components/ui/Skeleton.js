/**
 * Skeleton — placeholders animés (shimmer défini dans globals.css).
 * Remplace les spinners/textes "Chargement…" génériques.
 */
export function Skeleton({ className = '' }) {
  return <span className={`skeleton block ${className}`} aria-hidden="true" />;
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-panel border border-line rounded-2xl p-6 ${className}`} aria-hidden="true">
      <div className="flex items-center gap-3 mb-5">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/2 rounded" />
          <Skeleton className="h-2.5 w-1/3 rounded" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}
