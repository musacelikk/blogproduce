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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] rounded-xl border border-[#333333] overflow-hidden">
          <div className="p-6 border-b border-[#333333] flex items-center justify-between">
            <Skeleton className="h-6 w-32 bg-[#333333]" />
            <Skeleton className="h-4 w-16 bg-[#333333]" />
          </div>
          <div className="divide-y divide-[#333333]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full bg-[#333333]" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2 bg-[#333333]" />
                      <Skeleton className="h-3 w-48 bg-[#333333]" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full bg-[#333333]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-[#333333] overflow-hidden">
          <div className="p-6 border-b border-[#333333] flex items-center justify-between">
            <Skeleton className="h-6 w-32 bg-[#333333]" />
            <Skeleton className="h-4 w-16 bg-[#333333]" />
          </div>
          <div className="divide-y divide-[#333333]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg bg-[#333333]" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-2 bg-[#333333]" />
                    <Skeleton className="h-3 w-32 bg-[#333333]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

