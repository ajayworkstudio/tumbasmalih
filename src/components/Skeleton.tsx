export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Memuat">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-line" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] sm:gap-4.5">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-[18px] bg-white" />
        ))}
      </div>
    </div>
  );
}

export function BlockSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Memuat">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-line" />
      <div className="h-64 animate-pulse rounded-[18px] bg-white" />
    </div>
  );
}
