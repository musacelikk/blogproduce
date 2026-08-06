'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, ArrowUpRight, Clock, Crown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { PlanCardSkeleton, Skeleton } from '@/components/ui/skeleton';
import { BillingToggle } from '@/components/pricing/BillingToggle';
import { PlanCard } from '@/components/pricing/PlanCard';
import { PlanComparison } from '@/components/pricing/PlanComparison';
import { PlanGrid } from '@/components/pricing/PlanGrid';
import { QualityTiersSection } from '@/components/pricing/QualityTiersSection';
import {
  FALLBACK_TIERS,
  formatTokens,
  toPricingPlans,
  yearlySaving,
  type BillingPeriod,
  type PricingPlan,
} from '@/components/pricing/plan-model';
import {
  getAvailablePlans,
  getCurrentPlan,
  getEntitlement,
  getModelTiers,
  type Entitlement,
  type PlanDefinition,
  type TierInfo,
  type UserPlanInfo,
} from '@/lib/api';

const LEVEL_ORDER: Record<string, number> = { trial: 0, starter: 1, pro: 2, enterprise: 3 };

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [planInfo, setPlanInfo] = useState<UserPlanInfo | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [tiers, setTiers] = useState<TierInfo[]>([]);
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const [planList, current, ent, tierList] = await Promise.all([
        getAvailablePlans().catch(() => []),
        getCurrentPlan().catch(() => null),
        getEntitlement().catch(() => null),
        getModelTiers().catch(() => []),
      ]);
      setPlans(Array.isArray(planList) ? planList : []);
      setPlanInfo(current);
      setEntitlement(ent);
      setTiers(Array.isArray(tierList) ? tierList : []);
    } catch (err) {
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const pricingPlans = useMemo(() => toPricingPlans(plans), [plans]);
  const saving = useMemo(() => yearlySaving(pricingPlans), [pricingPlans]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <PlanCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const currentPlanId = planInfo?.currentPlan?.id ? String(planInfo.currentPlan.id) : null;
  const currentLevel = entitlement?.planLevel ?? planInfo?.currentPlan?.level ?? 'trial';
  const currentOrder = LEVEL_ORDER[currentLevel] ?? 0;
  const isTrial = Boolean(entitlement?.isTrial);
  const isExpired = Boolean(entitlement?.isExpired);

  const isCurrentPlan = (plan: PricingPlan) =>
    currentPlanId ? plan.id === currentPlanId : isTrial && plan.level === 'trial';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Planlar"
        description="Planları karşılaştırın, kalite kademelerini görün ve ihtiyacınıza uygun olanı seçin."
        actions={<BillingToggle value={period} onChange={setPeriod} saving={saving} />}
      />

      {/* Current plan strip */}
      {entitlement && (
        <Card variant={isExpired ? 'default' : 'emphasis'} className="p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-eyebrow">Şu anki planınız</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-foreground-strong">{entitlement.planName}</h2>
                {isExpired ? (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3" />
                    Süresi doldu
                  </Badge>
                ) : isTrial && entitlement.trialDaysRemaining != null ? (
                  <Badge variant="warning">
                    <Clock className="h-3 w-3" />
                    {entitlement.trialDaysRemaining} gün kaldı
                  </Badge>
                ) : (
                  <Badge variant="success">Aktif</Badge>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Aylık {formatTokens(entitlement.tokenAllowance)} token · kalan{' '}
                {formatTokens(entitlement.totalTokensRemaining)} token · ≈{' '}
                {formatTokens(entitlement.estimatedArticlesRemaining)} blog daha üretebilirsiniz.
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link href="/dashboard/billing">
                Faturalandırma
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Plan cards — same card the public pricing page renders */}
      {pricingPlans.length === 0 ? (
        <EmptyState
          icon={<Crown />}
          title="Şu anda görüntülenecek plan yok"
          description="Planlar kısa süre içinde yeniden listelenecek."
        />
      ) : (
        <>
          <PlanGrid count={pricingPlans.length}>
            {pricingPlans.map((plan) => {
              const current = isCurrentPlan(plan);
              const isUpgrade = (LEVEL_ORDER[plan.level] ?? 0) > currentOrder;
              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  period={period}
                  current={current}
                  action={
                    current ? (
                      <Button className="w-full" variant="secondary" disabled>
                        Mevcut planınız
                      </Button>
                    ) : (
                      <Button asChild className="w-full" variant={isUpgrade ? 'default' : 'outline'}>
                        <Link href={`/contact?plan=${encodeURIComponent(plan.name)}`}>
                          {isUpgrade ? 'Bu plana yükselt' : 'Bu plana geç'}
                          {isUpgrade ? <ArrowUpRight /> : <ArrowRight />}
                        </Link>
                      </Button>
                    )
                  }
                />
              );
            })}
          </PlanGrid>

          <QualityTiersSection tiers={tiers.length > 0 ? tiers : FALLBACK_TIERS} />

          <section>
            <div className="mb-4">
              <p className="text-eyebrow">Karşılaştırma</p>
              <h2 className="mt-1 text-lg font-semibold text-foreground-strong">Planlar yan yana</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Kalite kademeleri, kota ve özelliklerin plan bazında dağılımı.
              </p>
            </div>
            <PlanComparison plans={pricingPlans} period={period} heading={false} />
          </section>
        </>
      )}
    </div>
  );
}
