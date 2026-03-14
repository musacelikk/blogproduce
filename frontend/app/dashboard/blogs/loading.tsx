import { PageHeaderSkeleton, BlogCardSkeleton, StatsCardSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />

      <div className="bg-white rounded-xl p-4 border border-[#e5e5e5]">
        <div className="h-9 w-full bg-[#e5e5e5] animate-pulse rounded-lg mb-4" />
        <div className="h-9 w-48 bg-[#e5e5e5] animate-pulse rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
        <div className="p-4 border-b border-[#e5e5e5] flex items-center justify-between">
          <div className="h-6 w-32 bg-[#e5e5e5] animate-pulse rounded" />
          <div className="h-8 w-20 bg-[#e5e5e5] animate-pulse rounded-lg" />
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

