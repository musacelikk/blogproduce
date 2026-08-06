'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { PlanDefinition } from '@/lib/api';
import { trackButtonClick, trackCustomEvent } from '@/lib/analytics';
import { SectionHeading } from '@/components/sections/SectionHeading';
import { Button } from '@/components/ui/button';
import { BillingToggle } from '@/components/pricing/BillingToggle';
import { PlanCard } from '@/components/pricing/PlanCard';
import { PlanGrid } from '@/components/pricing/PlanGrid';
import { toPricingPlans, yearlySaving, type BillingPeriod } from '@/components/pricing/plan-model';

interface PricingSectionClientProps {
  plans: PlanDefinition[];
}

export function PricingSectionClient({ plans }: PricingSectionClientProps) {
  const [period, setPeriod] = React.useState<BillingPeriod>('monthly');

  const pricingPlans = React.useMemo(() => toPricingPlans(plans), [plans]);
  const saving = React.useMemo(() => yearlySaving(pricingPlans), [pricingPlans]);
  const trialDays = pricingPlans.find((plan) => plan.isTrial)?.trialDays ?? 7;

  if (pricingPlans.length === 0) {
    return (
      <section id="pricing" className="border-y border-border bg-surface-raised py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            align="center"
            eyebrow="Fiyatlandırma"
            title="İhtiyacınız kadar ödeyin"
            description="Planlar yakında eklenecek."
          />
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="border-y border-border bg-surface-raised py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          align="center"
          eyebrow="Fiyatlandırma"
          title="İhtiyacınız kadar ödeyin"
          description={`Her plan aylık token hakkı, RESTful API erişimi ve SEO optimizasyonlu üretim içerir. ${trialDays} gün ücretsiz deneyin, kredi kartı gerekmez.`}
        />

        <BillingToggle
          value={period}
          onChange={(next) => {
            setPeriod(next);
            trackButtonClick(`pricing_toggle_${next}`, '/');
          }}
          saving={saving}
          className="my-12"
        />

        <PlanGrid count={pricingPlans.length}>
          {pricingPlans.map((plan) => {
            const isEnterprise = plan.level === 'enterprise';
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                period={period}
                action={
                  <Button
                    asChild
                    size="lg"
                    variant={plan.popular ? 'default' : 'outline'}
                    className="w-full"
                  >
                    <Link
                      href={isEnterprise ? '/contact' : '/register'}
                      onClick={() => {
                        trackButtonClick(
                          isEnterprise ? 'contact_enterprise' : `select_plan_${plan.level}`,
                          '/',
                        );
                        trackCustomEvent('plan_selection', {
                          plan_name: plan.name,
                          plan_level: plan.level,
                          plan_id: plan.id,
                          billing_period: period,
                        });
                      }}
                    >
                      {isEnterprise
                        ? 'İletişime Geç'
                        : plan.isTrial
                        ? 'Ücretsiz Başla'
                        : 'Planı Seç'}
                      {!isEnterprise && <ArrowRight className="h-4 w-4" />}
                    </Link>
                  </Button>
                }
              />
            );
          })}
        </PlanGrid>

        <div className="mt-12 text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/pricing" onClick={() => trackButtonClick('pricing_see_all_plans', '/')}>
              Ek token paketlerini ve tüm detayları görün
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
