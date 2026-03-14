import { PageHeaderSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />

      <div className="bg-white rounded-xl border border-[#e5e5e5] p-1.5">
        <div className="flex flex-wrap gap-1.5">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 lg:p-6">
        <div className="flex items-center gap-2.5 mb-5 pb-5 border-b border-[#e5e5e5]">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-[#e5e5e5] flex justify-end">
          <Skeleton className="h-10 w-40 rounded-full" />
        </div>
      </div>
    </div>
  );
}

