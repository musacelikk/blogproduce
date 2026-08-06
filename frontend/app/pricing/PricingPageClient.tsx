'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Headphones, Landmark, ShieldCheck } from 'lucide-react';
import type { PlanDefinition, TierInfo, TokenPack } from '@/lib/api';
import { trackButtonClick, trackCustomEvent } from '@/lib/analytics';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BillingToggle } from '@/components/pricing/BillingToggle';
import { PlanCard } from '@/components/pricing/PlanCard';
import { PlanComparison } from '@/components/pricing/PlanComparison';
import { PlanGrid } from '@/components/pricing/PlanGrid';
import { PricingFaq } from '@/components/pricing/PricingFaq';
import { QualityTiersSection } from '@/components/pricing/QualityTiersSection';
import { TokenPacksSection } from '@/components/pricing/TokenPacksSection';
import { TrialCallout } from '@/components/pricing/TrialCallout';
import {
  toPricingPacks,
  toPricingPlans,
  yearlySaving,
  type BillingPeriod,
  type PricingPlan,
} from '@/components/pricing/plan-model';

interface PricingPageClientProps {
  plans: PlanDefinition[];
  packs: TokenPack[];
  tiers: TierInfo[];
}

const TRUST_SIGNALS = [
  { icon: Landmark, label: 'Havale / EFT ile ödeme' },
  { icon: ShieldCheck, label: 'Kredi kartı gerekmez' },
  { icon: Headphones, label: 'Türkçe destek' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5, delay, ease: [0.25, 1, 0.5, 1] as const },
});

function planCta(plan: PricingPlan, period: BillingPeriod) {
  const isEnterprise = plan.level === 'enterprise';
  const label = isEnterprise ? 'İletişime Geç' : plan.isTrial ? 'Ücretsiz Başla' : 'Planı Seç';

  return (
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
            '/pricing',
          );
          trackCustomEvent('plan_selection', {
            plan_name: plan.name,
            plan_level: plan.level,
            plan_id: plan.id,
            billing_period: period,
          });
        }}
      >
        {label}
        {!isEnterprise && <ArrowRight className="h-4 w-4" />}
      </Link>
    </Button>
  );
}

export function PricingPageClient({ plans, packs, tiers }: PricingPageClientProps) {
  const [period, setPeriod] = React.useState<BillingPeriod>('monthly');

  const pricingPlans = React.useMemo(() => toPricingPlans(plans), [plans]);
  const pricingPacks = React.useMemo(() => toPricingPacks(packs), [packs]);
  const saving = React.useMemo(() => yearlySaving(pricingPlans), [pricingPlans]);
  const trialDays = pricingPlans.find((plan) => plan.isTrial)?.trialDays ?? 7;

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full px-4 pb-20 pt-32 sm:px-6 sm:pb-28 sm:pt-40 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-20 sm:space-y-28">
          {/* Hero */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            className="text-center"
          >
            <p className="text-eyebrow">Fiyatlandırma</p>
            <h1 className="mx-auto mt-4 max-w-3xl text-display-lg text-foreground-strong">
              Ürettiğiniz kadar ödeyin, kalitesinden ödün vermeyin
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Her plan aylık token hakkıyla gelir; token biterse ek paketle tamamlarsınız.
              {trialDays} gün ücretsiz deneyin, kredi kartı gerekmez.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
              {TRUST_SIGNALS.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-card"
                >
                  <Icon className="h-3.5 w-3.5 text-accent-foreground" />
                  {label}
                </span>
              ))}
            </div>
          </motion.section>

          {pricingPlans.length === 0 ? (
            <section className="text-center">
              <Badge variant="outline" className="mb-4">
                Hazırlanıyor
              </Badge>
              <h2 className="text-display-md text-foreground-strong">Planlar yakında eklenecek</h2>
              <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
                Bu sırada ücretsiz denemeyle başlayabilir, ihtiyacınızı bizimle paylaşabilirsiniz.
              </p>
            </section>
          ) : (
            <>
              {/* Plans */}
              <section className="scroll-mt-24" id="planlar">
                <BillingToggle
                  value={period}
                  onChange={(next) => {
                    setPeriod(next);
                    trackButtonClick(`pricing_toggle_${next}`, '/pricing');
                  }}
                  saving={saving}
                  className="mb-10"
                />

                <PlanGrid count={pricingPlans.length}>
                  {pricingPlans.map((plan, index) => (
                    <motion.div key={plan.id} {...fadeUp(index * 0.06)} className="h-full">
                      <PlanCard plan={plan} period={period} action={planCta(plan, period)} />
                    </motion.div>
                  ))}
                </PlanGrid>

                <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-muted-foreground">
                  Fiyatlar Türk Lirası cinsindendir. Aylık token hakkı her ay başında yenilenir.
                  Ödemeler havale/EFT ile alınır: planı seçtikten sonra panelde banka bilgilerimizi
                  ve size özel referans kodunu görürsünüz, transferi mesai saatleri içinde
                  onaylıyoruz.
                </p>
              </section>

              {/* Pay as you go */}
              <motion.div {...fadeUp()}>
                <TokenPacksSection packs={pricingPacks} />
              </motion.div>

              {/* Quality tiers */}
              <motion.div {...fadeUp()}>
                <QualityTiersSection tiers={tiers} />
              </motion.div>

              {/* Comparison */}
              <motion.div {...fadeUp()}>
                <PlanComparison plans={pricingPlans} period={period} />
              </motion.div>
            </>
          )}

          {/* Trial CTA */}
          <motion.div {...fadeUp()}>
            <TrialCallout
              trialDays={trialDays}
              onStartClick={() => trackButtonClick('pricing_trial_cta', '/pricing')}
              onContactClick={() => trackButtonClick('pricing_contact_cta', '/pricing')}
            />
          </motion.div>

          {/* FAQ */}
          <motion.div {...fadeUp()}>
            <PricingFaq />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
