import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md', className)}
      style={{ backgroundColor: 'var(--border)' }}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-5 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-24 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function BlogCardSkeleton() {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton className="h-5 w-full mb-3" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-7 w-20 rounded" />
      </div>
    </div>
  );
}

export function BlogListSkeleton() {
  return (
    <div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <Skeleton className="h-5 w-3/4 mb-3" />
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="p-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <Skeleton className="h-6 w-32" />
      </div>
      <div>
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-6" style={{ borderBottom: i < rows - 1 ? '1px solid var(--border)' : 'none' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlanCardSkeleton() {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '2px solid var(--border)' }}>
      <Skeleton className="h-12 w-12 rounded-lg mb-4" />
      <Skeleton className="h-6 w-32 mb-2" />
      <Skeleton className="h-3 w-full mb-4" />
      <div className="mb-4">
        <Skeleton className="h-9 w-24 mb-1" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-10 w-full rounded-full mb-4" />
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function UsageCardSkeleton() {
  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-7 w-32 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-6">
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-96" />
    </div>
  );
}

export function AdminCardSkeleton() {
  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#333333] p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-3 w-20 bg-[#333333]" />
        <Skeleton className="h-5 w-5 rounded-lg bg-[#333333]" />
      </div>
      <Skeleton className="h-7 w-24 mb-2 bg-[#333333]" />
      <Skeleton className="h-3 w-32 bg-[#333333]" />
    </div>
  );
}

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#333333] overflow-hidden">
      <div className="p-6 border-b border-[#333333]">
        <Skeleton className="h-6 w-32 bg-[#333333]" />
      </div>
      <div className="divide-y divide-[#333333]">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <Skeleton className="h-10 w-10 rounded-full bg-[#333333]" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2 bg-[#333333]" />
                  <Skeleton className="h-3 w-48 bg-[#333333]" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-16 mb-2 bg-[#333333]" />
                <Skeleton className="h-5 w-20 rounded-full bg-[#333333]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { Skeleton };

