import { PageHeaderSkeleton, PlanCardSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      <div className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-xl p-6">
        <div className="h-6 w-32 bg-white/20 animate-pulse rounded mb-2" />
        <div className="h-8 w-40 bg-white/20 animate-pulse rounded mb-2" />
        <div className="h-4 w-24 bg-white/20 animate-pulse rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => (
          <PlanCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

