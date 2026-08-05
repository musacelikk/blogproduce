import { AdminTableSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex flex-col md:flex-row gap-4">
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-9 w-48 rounded-lg" />
        </div>
      </div>

      <AdminTableSkeleton rows={10} />
    </div>
  );
}

