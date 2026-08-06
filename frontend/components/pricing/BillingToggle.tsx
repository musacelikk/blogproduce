'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { BillingPeriod } from './plan-model';

interface BillingToggleProps {
  value: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
  /** Real saving computed from the plan data; hidden when there is none. */
  saving?: { pct: number; uniform: boolean } | null;
  className?: string;
}

/** The one monthly/yearly switch used by every pricing surface. */
export function BillingToggle({ value, onChange, saving, className }: BillingToggleProps) {
  const options: { key: BillingPeriod; label: string }[] = [
    { key: 'monthly', label: 'Aylık' },
    { key: 'yearly', label: 'Yıllık' },
  ];

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        role="radiogroup"
        aria-label="Faturalandırma dönemi"
        className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-sunken p-1"
      >
        {options.map((option) => {
          const active = value === option.key;
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.key)}
              className={cn(
                'rounded-full px-6 py-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-base ease-out-quart',
                active
                  ? 'bg-card text-foreground-strong shadow-card'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {saving && saving.pct > 0 && (
        <Badge variant="success">
          Yıllık ödemede {saving.uniform ? `%${saving.pct}` : `%${saving.pct}'ye varan`} tasarruf
        </Badge>
      )}
    </div>
  );
}
