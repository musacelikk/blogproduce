import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <Skeleton className="mb-2 h-4 w-32" />
        <Skeleton className="mb-2 h-8 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6">
            <Skeleton className="mb-4 h-10 w-10 rounded-lg" />
            <Skeleton className="mb-2 h-6 w-32" />
            <Skeleton className="mb-4 h-3 w-full" />
            <Skeleton className="mb-1 h-9 w-24" />
            <Skeleton className="mb-4 h-3 w-32" />
            <Skeleton className="mb-4 h-10 w-full rounded-lg" />
            <div className="space-y-2">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
