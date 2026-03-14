import { PageHeaderSkeleton, StatsCardSkeleton, BlogListSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
        <div className="h-6 w-32 mb-3 bg-[#e5e5e5] animate-pulse rounded" />
        <div className="flex flex-wrap gap-2.5">
          <div className="h-9 w-32 bg-[#e5e5e5] animate-pulse rounded-full" />
          <div className="h-9 w-36 bg-[#e5e5e5] animate-pulse rounded-full" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
        <div className="p-5 border-b border-[#e5e5e5] flex items-center justify-between">
          <div className="h-6 w-32 bg-[#e5e5e5] animate-pulse rounded" />
          <div className="h-4 w-16 bg-[#e5e5e5] animate-pulse rounded" />
        </div>
        <BlogListSkeleton />
      </div>
    </div>
  );
}

