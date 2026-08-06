import * as React from 'react';
import { Check, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  TIER_LABELS,
  TIER_ORDER,
  formatCount,
  formatPercent,
  formatTokens,
  formatTry,
  formatWorkspaces,
  type BillingPeriod,
  type PricingPlan,
} from './plan-model';

interface PlanCardProps {
  plan: PricingPlan;
  period: BillingPeriod;
  /** The card's call to action — each surface owns its own action and analytics. */
  action?: React.ReactNode;
  /** Marks the viewer's active subscription. */
  current?: boolean;
  className?: string;
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-foreground-strong">{value}</span>
    </div>
  );
}

/**
 * The plan card. Shared by /pricing, the homepage section and the in-app plan
 * picker — there is deliberately no second copy of this markup anywhere.
 */
export function PlanCard({ plan, period, action, current, className }: PlanCardProps) {
  const yearly = period === 'yearly' && plan.yearlyPrice > 0;
  const isFree = plan.monthlyPrice === 0;

  return (
    <Card
      variant={plan.popular ? 'emphasis' : 'default'}
      className={cn(
        'relative flex h-full flex-col p-6',
        plan.popular && 'shadow-elevated',
        current && !plan.popular && 'border-primary/40',
        className,
      )}
    >
      {(plan.popular || current) && (
        <div className="absolute -top-3 left-6">
          <Badge variant={current ? 'success' : 'primary'}>
            {current ? 'Aktif Plan' : 'En Popüler'}
          </Badge>
        </div>
      )}

      <div className={cn(plan.popular || current ? 'pt-2' : undefined)}>
        <h3 className="text-lg font-semibold text-foreground-strong">{plan.name}</h3>
        {plan.description && (
          <p className="mt-1.5 min-h-[2.5rem] text-sm leading-relaxed text-muted-foreground">
            {plan.description}
          </p>
        )}
      </div>

      <div className="mt-5">
        {isFree ? (
          <>
            <p className="text-display-md text-foreground-strong">Ücretsiz</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {plan.trialDays ? `${plan.trialDays} gün, kredi kartı gerekmez` : 'Kredi kartı gerekmez'}
            </p>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="text-display-md text-foreground-strong">
                {formatTry(yearly ? plan.yearlyPerMonth : plan.monthlyPrice)}
              </span>
              <span className="text-base text-muted-foreground">/ay</span>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {yearly ? (
                <>
                  Yıllık {formatTry(plan.yearlyPrice)} olarak faturalanır
                  {plan.yearlySavingTry > 0 && (
                    <span className="font-medium text-success">
                      {' '}
                      · {formatTry(plan.yearlySavingTry)} tasarruf
                    </span>
                  )}
                </>
              ) : plan.yearlySavingPct > 0 ? (
                <>
                  Yıllık ödemede aylık {formatTry(plan.yearlyPerMonth)}
                  <span className="font-medium text-success">
                    {' '}
                    · {formatPercent(plan.yearlySavingPct)} indirim
                  </span>
                </>
              ) : (
                'Aylık faturalandırma, taahhüt yok'
              )}
            </p>
          </>
        )}
      </div>

      {!isFree && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Landmark className="h-3.5 w-3.5 shrink-0 text-accent-foreground" />
          Ödeme havale/EFT ile alınır
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}

      <div className="mt-6 space-y-2.5 rounded-lg bg-surface-sunken p-4">
        <MetricRow
          label="Aylık token"
          value={plan.tokenAllowance === null ? 'Sınırsız' : formatTokens(plan.tokenAllowance)}
        />
        <MetricRow
          label="Tahmini blog"
          value={
            plan.estimatedArticles === null
              ? 'Sınırsız'
              : `≈ ${formatCount(plan.estimatedArticles)} / ay`
          }
        />
        <MetricRow label="Workspace" value={formatWorkspaces(plan.maxWorkspaces)} />
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Kalite kademeleri
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {TIER_ORDER.map((tier) => {
            const unlocked = plan.allowedTiers.includes(tier);
            return (
              <span
                key={tier}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                  unlocked
                    ? 'border-transparent bg-accent text-accent-foreground'
                    : 'border-border text-muted-foreground/60',
                )}
                title={unlocked ? `${TIER_LABELS[tier]} kademesi dahil` : `${TIER_LABELS[tier]} kademesi bu planda yok`}
              >
                {unlocked && <Check className="h-3 w-3" />}
                {TIER_LABELS[tier]}
              </span>
            );
          })}
        </div>
      </div>

      <div className="divider-soft my-5" />

      <ul className="flex flex-1 flex-col gap-2.5">
        {plan.highlights.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success-muted">
              <Check className="h-2.5 w-2.5 text-success" />
            </span>
            <span className="text-sm leading-relaxed text-foreground">{feature}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
