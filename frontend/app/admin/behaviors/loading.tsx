import { AdminTableSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="h-8 w-48 bg-[#333333] animate-pulse rounded mb-2" />
        <div className="h-4 w-96 bg-[#333333] animate-pulse rounded" />
      </div>
      <AdminTableSkeleton rows={10} />
    </div>
  );
}

