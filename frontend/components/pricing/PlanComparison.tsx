import * as React from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeading } from '@/components/sections/SectionHeading';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  COMPARISON_GROUPS,
  formatUsd,
  type BillingPeriod,
  type PricingPlan,
} from './plan-model';

function ComparisonValue({ value }: { value: boolean | string }) {
  if (value === false) {
    return <Minus className="mx-auto h-4 w-4 text-muted-foreground/60" aria-label="Yok" />;
  }
  if (value === true) {
    return (
      <span className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-success-muted">
        <Check className="h-3 w-3 text-success" aria-label="Var" />
      </span>
    );
  }
  return <span className="block text-center text-sm tabular-nums">{value}</span>;
}

/** Full feature matrix, driven by the same model the plan cards read. */
export function PlanComparison({
  plans,
  period = 'monthly',
  heading = true,
  className,
}: {
  plans: PricingPlan[];
  period?: BillingPeriod;
  /** Off when the surface already has its own section title. */
  heading?: boolean;
  className?: string;
}) {
  if (plans.length === 0) return null;

  return (
    <section className={cn('scroll-mt-24', className)} id="karsilastirma">
      {heading && (
        <SectionHeading
          align="center"
          size="md"
          eyebrow="Karşılaştırma"
          title="Planlar yan yana"
          description="Hangi planın neyi açtığını tek tabloda görün."
        />
      )}

      <div className={cn(heading && 'mt-10')}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Özellik</TableHead>
              {plans.map((plan) => (
                <TableHead key={plan.id} className="min-w-[130px] text-center">
                  <span className={cn(plan.popular && 'text-accent-foreground')}>{plan.name}</span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="text-sm font-medium text-foreground-strong">
                {period === 'yearly' ? 'Yıllık ödemede aylık' : 'Aylık fiyat'}
              </TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.id} className="text-center text-sm tabular-nums">
                  {plan.monthlyPrice === 0
                    ? 'Ücretsiz'
                    : `${formatUsd(
                        period === 'yearly' && plan.yearlyPrice > 0
                          ? plan.yearlyPerMonth
                          : plan.monthlyPrice,
                      )}/ay`}
                </TableCell>
              ))}
            </TableRow>
            {COMPARISON_GROUPS.map((group) => (
              <React.Fragment key={group.category}>
                <TableRow className="hover:bg-surface-raised">
                  <TableCell
                    colSpan={plans.length + 1}
                    className="bg-surface-raised text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {group.category}
                  </TableCell>
                </TableRow>
                {group.rows.map((row) => (
                  <TableRow key={`${group.category}-${row.name}`}>
                    <TableCell className="text-sm font-medium text-foreground-strong">
                      {row.name}
                    </TableCell>
                    {plans.map((plan) => (
                      <TableCell key={plan.id} className="text-center">
                        <ComparisonValue value={row.value(plan)} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
