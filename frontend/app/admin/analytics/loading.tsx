import { AdminCardSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 bg-[#333333] mb-2" />
        <Skeleton className="h-4 w-96 bg-[#333333]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <AdminCardSkeleton key={i} />
        ))}
      </div>

      <div className="bg-[#1a1a1a] rounded-xl border border-[#333333] p-6">
        <Skeleton className="h-6 w-32 mb-4 bg-[#333333]" />
        <Skeleton className="h-64 w-full bg-[#333333] rounded-lg" />
      </div>
    </div>
  );
}

