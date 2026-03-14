import { PageHeaderSkeleton, TableSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeaderSkeleton />
        <div className="h-10 w-32 bg-[#e5e5e5] animate-pulse rounded-lg" />
      </div>

      <div className="bg-white rounded-xl p-6 border border-[#e5e5e5]">
        <div className="h-6 w-32 bg-[#e5e5e5] animate-pulse rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="h-3 w-24 bg-[#e5e5e5] animate-pulse rounded mb-2" />
              <div className="h-5 w-32 bg-[#e5e5e5] animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>

      <TableSkeleton rows={5} />
    </div>
  );
}

