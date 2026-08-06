import { Skeleton } from '@/components/ui/skeleton';

function TableBlockSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="mb-2 h-3 w-24" />
        <Skeleton className="mb-2 h-5 w-56" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-4 p-4">
          {[...Array(rows)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="space-y-10">
      {/* Başlık + ay seçici */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="mb-2 h-8 w-56" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-44 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>

      {/* KPI satırı */}
      <div className="space-y-4">
        <div>
          <Skeleton className="mb-2 h-3 w-24" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
              <Skeleton className="mb-2 h-7 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>
      </div>

      <TableBlockSkeleton rows={3} />
      <TableBlockSkeleton rows={4} />

      {/* Senaryo hesaplayıcı */}
      <div className="space-y-4">
        <div>
          <Skeleton className="mb-2 h-3 w-24" />
          <Skeleton className="mb-2 h-5 w-64" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <Skeleton className="mb-1.5 h-3 w-28" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-surface-raised p-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-2 h-3 w-32" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <TableBlockSkeleton rows={3} />
      <TableBlockSkeleton rows={4} />
    </div>
  );
}
