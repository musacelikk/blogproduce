import { PageHeaderSkeleton, UsageCardSkeleton, TableSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <PageHeaderSkeleton />
        <div className="h-9 w-48 bg-[#e5e5e5] animate-pulse rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <UsageCardSkeleton key={i} />
        ))}
      </div>

      <TableSkeleton rows={5} />
    </div>
  );
}

