type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse rounded-2xl bg-white/10 ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-sm">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="mt-3 h-4 w-1/3" />
      <Skeleton className="mt-6 h-24 w-full" />
      <Skeleton className="mt-4 h-16 w-full" />
    </div>
  );
}