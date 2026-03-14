import { AdminTableSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 bg-[#333333] mb-2" />
        <Skeleton className="h-4 w-96 bg-[#333333]" />
      </div>

      <AdminTableSkeleton rows={10} />
    </div>
  );
}

