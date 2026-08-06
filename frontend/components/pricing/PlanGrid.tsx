import * as React from 'react';
import { cn } from '@/lib/utils';

/** Column count that keeps four plans readable without squeezing three. */
export function planGridClass(count: number): string {
  if (count >= 4) return 'grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4';
  if (count === 3) return 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3';
  if (count === 2) return 'grid grid-cols-1 gap-6 sm:grid-cols-2';
  return 'grid grid-cols-1 gap-6';
}

export function PlanGrid({
  count,
  className,
  children,
}: {
  count: number;
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn(planGridClass(count), 'items-stretch', className)}>{children}</div>;
}
