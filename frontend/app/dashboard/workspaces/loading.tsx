import { PageHeaderSkeleton, CardSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="h-4 w-32 bg-blue-200/50 animate-pulse rounded mb-2" />
        <div className="h-3 w-full bg-blue-200/50 animate-pulse rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

