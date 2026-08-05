'use client';

import * as React from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlanDefinition } from '@/lib/api';
import { trackButtonClick, trackCustomEvent } from '@/lib/analytics';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type PlanLevel = 'starter' | 'pro' | 'enterprise';

interface PricingFeature {
  name: string;
  included: PlanLevel | 'all';
}

interface PricingSectionClientProps {
  plans: PlanDefinition[];
  features: PricingFeature[];
}

function shouldShowCheck(
  included: PricingFeature['included'],
  level: PlanLevel,
): boolean {
  if (included === 'all') return true;
  if (included === 'enterprise' && level === 'enterprise') return true;
  if (included === 'pro' && (level === 'pro' || level === 'enterprise'))
    return true;
  if (included === 'starter') return true;
  return false;
}

function byMonthlyPrice(a: PlanDefinition, b: PlanDefinition) {
  return (a.price?.monthly || 0) - (b.price?.monthly || 0);
}

export function PricingSectionClient({ plans, features }: PricingSectionClientProps) {
  const router = useRouter();
  const [isYearly, setIsYearly] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<PlanLevel>('pro');

  const yearlyDiscount = React.useMemo(() => {
    if (!plans || plans.length === 0) return null;
    const referencePlan =
      plans.find((p) => p.level === 'pro') ||
      plans[0];

    if (!referencePlan || !referencePlan.price?.monthly || !referencePlan.price?.yearly) {
      return null;
    }

    const fullYear = referencePlan.price.monthly * 12;
    if (fullYear <= 0) return null;

    const discount = 100 - Math.round((referencePlan.price.yearly / fullYear) * 100);
    return Math.max(0, discount);
  }, [plans]);

  const sortedPlans = React.useMemo(() => [...plans].sort(byMonthlyPrice), [plans]);

  // If no plans, show empty state
  if (plans.length === 0) {
    return (
      <section id="pricing" className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Planınızı Seçin
            </h2>
            <p className="text-lg text-muted-foreground">Planlar yakında eklenecek.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="border-t border-border bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Planınızı Seçin
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            BlogProduce AI destekli blog üretim API&apos;si ile başlayın. Tüm planlar RESTful API erişimi, SEO optimizasyonu ve prompt&apos;a göre özelleştirilebilir içerik üretimi içerir.
          </p>
        </div>

        <div className="mb-12 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full bg-secondary p-1">
            <button
              type="button"
              onClick={() => {
                setIsYearly(false);
                trackButtonClick('pricing_toggle_monthly', '/');
              }}
              className={cn(
                'rounded-full px-6 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                !isYearly
                  ? 'bg-card text-foreground shadow-card'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Aylık
            </button>
            <button
              type="button"
              onClick={() => {
                setIsYearly(true);
                trackButtonClick('pricing_toggle_yearly', '/');
              }}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isYearly
                  ? 'bg-card text-foreground shadow-card'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Yıllık
              {typeof yearlyDiscount === 'number' && yearlyDiscount > 0 && (
                <Badge variant="success">%{yearlyDiscount} Tasarruf</Badge>
              )}
            </button>
          </div>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {sortedPlans.map((plan) => {
            const price = isYearly ? plan.price.yearly : plan.price.monthly;
            const isSelected = selectedPlan === plan.level;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => {
                  setSelectedPlan(plan.level);
                  trackButtonClick(`select_plan_${plan.level}`, '/');
                  trackCustomEvent('plan_selection', {
                    plan_name: plan.name,
                    plan_level: plan.level,
                    plan_id: plan.id,
                    billing_period: isYearly ? 'yearly' : 'monthly',
                  });
                }}
                className={cn(
                  'relative rounded-xl border bg-card p-6 text-left shadow-card transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected
                    ? 'border-primary shadow-card-hover'
                    : 'border-border hover:shadow-card-hover',
                )}
              >
                {plan.popular && (
                  <Badge
                    variant="primary"
                    className="absolute -top-3 left-1/2 -translate-x-1/2"
                  >
                    En Popüler
                  </Badge>
                )}
                <div className="mb-6">
                  <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tracking-tight text-foreground">
                      {price.toLocaleString('tr-TR')}$
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /{isYearly ? 'yıl' : 'ay'}
                    </span>
                  </div>
                </div>
                <div
                  className={cn(
                    'w-full rounded-lg px-6 py-2.5 text-center text-sm font-medium transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground',
                  )}
                >
                  {isSelected ? 'Seçildi' : 'Planı Seç'}
                </div>
              </button>
            );
          })}
        </div>

        {features.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[280px]">Özellikler</TableHead>
                {sortedPlans.map((plan) => (
                  <TableHead key={plan.level} className="w-28 text-center">
                    {plan.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {features.map((feature) => (
                <TableRow
                  key={feature.name}
                  className={cn(feature.included === selectedPlan && 'bg-accent')}
                >
                  <TableCell className="text-sm">{feature.name}</TableCell>
                  {sortedPlans.map((plan) => (
                    <TableCell key={plan.level} className="text-center">
                      {shouldShowCheck(feature.included, plan.level) ? (
                        <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3.5 w-3.5 text-primary-foreground" />
                        </span>
                      ) : (
                        <Minus className="mx-auto h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="mt-12 text-center">
          <Button
            size="lg"
            onClick={() => {
              const selectedPlanData = plans.find((p) => p.level === selectedPlan);
              trackButtonClick('pricing_start_button', '/');
              trackCustomEvent('pricing_cta_click', {
                plan_name: selectedPlanData?.name,
                plan_level: selectedPlan,
                billing_period: isYearly ? 'yearly' : 'monthly',
              });
              router.push('/register');
            }}
          >
            {plans.find((p) => p.level === selectedPlan)?.name || 'Plan'} ile başlayın
          </Button>
        </div>
      </div>
    </section>
  );
}
