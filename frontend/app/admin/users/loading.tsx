import { AdminTableSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 bg-[#333333] mb-2" />
        <Skeleton className="h-4 w-96 bg-[#333333]" />
      </div>

      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333333]">
        <div className="flex flex-col md:flex-row gap-4">
          <Skeleton className="h-9 w-full bg-[#333333] rounded-lg" />
          <Skeleton className="h-9 w-48 bg-[#333333] rounded-lg" />
          <Skeleton className="h-9 w-48 bg-[#333333] rounded-lg" />
        </div>
      </div>

      <AdminTableSkeleton rows={10} />
    </div>
  );
}

