'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlanDefinition } from '@/lib/api';
import { trackButtonClick, trackCustomEvent } from '@/lib/analytics';
import { useRouter } from 'next/navigation';

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

  // If no plans, show empty state
  if (plans.length === 0) {
    return (
      <section className="py-24 bg-background" id="pricing">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2
              className="text-[40px] font-normal leading-tight mb-4"
              style={{
                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
            >
              Planınızı Seçin
            </h2>
            <p
              className="text-lg text-muted-foreground"
              style={{
                fontFamily: 'var(--font-sans), "Inter", sans-serif',
              }}
            >
              Planlar yakında eklenecek.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-background" id="pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2
            className="text-[40px] font-normal leading-tight mb-4"
            style={{
              fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
            }}
          >
            Planınızı Seçin
          </h2>
          <p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            style={{
              fontFamily: 'var(--font-sans), "Inter", sans-serif',
            }}
          >
            BlogGenerator AI destekli blog üretim API&apos;si ile başlayın. Tüm planlar RESTful API erişimi, SEO optimizasyonu ve prompt&apos;a göre özelleştirilebilir içerik üretimi içerir.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-2 bg-secondary rounded-full p-1">
            <button
              type="button"
              onClick={() => {
                setIsYearly(false);
                trackButtonClick('pricing_toggle_monthly', '/');
              }}
              className={cn(
                'px-6 py-2 rounded-full text-lg transition-all',
                !isYearly
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              style={{
                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
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
                'px-6 py-2 rounded-full text-lg transition-all',
                isYearly
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              style={{
                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
              }}
            >
              Yıllık
              {typeof yearlyDiscount === 'number' && yearlyDiscount > 0 && (
                <span className="ml-2 text-sm text-[#3B82F6]">
                  %{yearlyDiscount} Tasarruf
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans
            .sort((a, b) => {
              const priceA = a.price?.monthly || 0;
              const priceB = b.price?.monthly || 0;
              return priceA - priceB;
            })
            .map((plan) => {
            const price = isYearly ? plan.price.yearly : plan.price.monthly;
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
                  'relative p-8 rounded-2xl text-left transition-all border-2',
                  selectedPlan === plan.level
                    ? 'border-[#3B82F6] bg-[#3B82F6]/5'
                    : 'border-border hover:border-[#3B82F6]/50',
                )}
              >
                {plan.popular && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#3B82F6] text-white px-4 py-1 rounded-full text-sm"
                    style={{
                      fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                    }}
                  >
                    En Popüler
                  </span>
                )}
                <div className="mb-6">
                  <h3
                    className="text-2xl font-medium mb-2"
                    style={{
                      fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                    }}
                  >
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-4xl font-medium"
                      style={{
                        fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                      }}
                    >
                      {price.toLocaleString('tr-TR')}$
                    </span>
                    <span
                      className="text-lg text-muted-foreground"
                      style={{
                        fontFamily: 'var(--font-sans), "Inter", sans-serif',
                      }}
                    >
                      /{isYearly ? 'yıl' : 'ay'}
                    </span>
                  </div>
                </div>
                <div
                  className={cn(
                    'w-full py-3 px-6 rounded-full text-lg transition-all text-center',
                    selectedPlan === plan.level
                      ? 'bg-[#3B82F6] text-white'
                      : 'bg-secondary text-foreground',
                  )}
                  style={{
                    fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                  }}
                >
                  {selectedPlan === plan.level ? 'Seçildi' : 'Planı Seç'}
                </div>
              </button>
            );
          })}
        </div>

        {features.length > 0 && (
          <div className="border border-border rounded-2xl overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <div className="min-w-[768px]">
                <div className="flex items-center p-6 bg-secondary border-b border-border">
                  <div className="flex-1">
                    <h3
                      className="text-xl font-medium"
                      style={{
                        fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                      }}
                    >
                      Özellikler
                    </h3>
                  </div>
                  <div className="flex items-center gap-8">
                    {plans
                      .sort((a, b) => {
                        const priceA = a.price?.monthly || 0;
                        const priceB = b.price?.monthly || 0;
                        return priceA - priceB;
                      })
                      .map((plan) => (
                        <div
                          key={plan.level}
                          className="w-24 text-center text-lg font-medium"
                          style={{
                            fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                          }}
                        >
                          {plan.name}
                        </div>
                      ))}
                  </div>
                </div>

                {features.map((feature, index) => (
                  <div
                    key={feature.name}
                    className={cn(
                      'flex items-center p-6 transition-colors',
                      index % 2 === 0 ? 'bg-background' : 'bg-secondary/30',
                      feature.included === selectedPlan && 'bg-[#3B82F6]/5',
                    )}
                  >
                    <div className="flex-1">
                      <span
                        className="text-lg"
                        style={{
                          fontFamily: 'var(--font-sans), "Inter", sans-serif',
                        }}
                      >
                        {feature.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-8">
                      {plans
                        .sort((a, b) => {
                          const priceA = a.price?.monthly || 0;
                          const priceB = b.price?.monthly || 0;
                          return priceA - priceB;
                        })
                        .map((plan) => (
                          <div key={plan.level} className="w-24 flex justify-center">
                            {shouldShowCheck(feature.included, plan.level) ? (
                              <div className="w-6 h-6 rounded-full bg-[#3B82F6] flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <button
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
            className="bg-[#3B82F6] text-white px-[18px] py-[15px] rounded-full text-lg hover:rounded-2xl hover:bg-[#2563EB] transition-all"
            style={{
              fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
            }}
          >
            {plans.find((p) => p.level === selectedPlan)?.name || 'Plan'} ile başlayın
          </button>
        </div>
      </div>
    </section>
  );
}

