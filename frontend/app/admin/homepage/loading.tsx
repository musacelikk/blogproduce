import { AdminTableSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 bg-[#333333] mb-2" />
        <Skeleton className="h-4 w-96 bg-[#333333]" />
      </div>

      <div className="bg-[#1a1a1a] rounded-xl border border-[#333333] p-6">
        <div className="h-6 w-64 bg-[#333333] animate-pulse rounded mb-4" />
        <div className="h-9 w-full bg-[#333333] animate-pulse rounded-lg mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border-2 border-[#333333] rounded-lg p-4">
              <div className="h-16 w-16 bg-[#333333] animate-pulse rounded-lg mb-3" />
              <div className="h-4 w-full bg-[#333333] animate-pulse rounded mb-2" />
              <div className="h-3 w-3/4 bg-[#333333] animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl border border-[#333333] p-6">
        <div className="h-6 w-32 bg-[#333333] animate-pulse rounded mb-4" />
        <AdminTableSkeleton rows={5} />
      </div>
    </div>
  );
}

