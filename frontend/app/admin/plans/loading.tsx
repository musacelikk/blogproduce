import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6 shadow-card">
            <Skeleton className="mb-3 h-5 w-32" />
            <Skeleton className="mb-2 h-9 w-24" />
            <Skeleton className="mb-5 h-3 w-40" />
            <div className="space-y-2">
              {[...Array(5)].map((_, j) => (
                <Skeleton key={j} className="h-3 w-full" />
              ))}
            </div>
            <div className="mt-5 flex gap-2 border-t border-border pt-4">
              <Skeleton className="h-9 flex-1 rounded-lg" />
              <Skeleton className="h-9 w-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
