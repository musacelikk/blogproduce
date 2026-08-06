import * as React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { cn } from '@/lib/utils';

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: string;
  trend?: { value: string; positive?: boolean };
  /** 0–100. Renders a quota/progress meter under the value. */
  progress?: number;
}

/** KPI tile used on dashboard/admin overview screens. */
function StatCard({
  label,
  value,
  icon,
  hint,
  trend,
  progress,
  className,
  ...props
}: StatCardProps) {
  const TrendIcon = trend?.positive === false ? ArrowDownRight : ArrowUpRight;

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-card transition-[box-shadow,border-color] duration-base ease-out-quart hover:border-strong hover:shadow-card-hover',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground [&_svg]:h-4 [&_svg]:w-4">
            {icon}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline gap-2">
        {/* Tabular figures keep columns of numbers from shifting as values change. */}
        <span className="text-[28px] font-semibold leading-none tracking-tight text-foreground-strong tabular-nums">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium',
              trend.positive === false ? 'text-destructive' : 'text-success',
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            {trend.value}
          </span>
        )}
      </div>

      {typeof progress === 'number' && (
        <div
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        >
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-slow ease-out-quart',
              progress >= 90 ? 'bg-destructive' : progress >= 75 ? 'bg-warning' : 'bg-primary',
            )}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {hint && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

export { StatCard };
