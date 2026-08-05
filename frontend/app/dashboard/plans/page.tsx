'use client';

import { useState, useEffect } from 'react';
import { Check, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import Link from 'next/link';
import { Skeleton, PlanCardSkeleton } from '@/components/ui/skeleton';
import { getAvailablePlans, getCurrentPlan, type PlanDefinition, type UserPlanInfo } from '@/lib/api';

const planIcons: Record<string, any> = {
  starter: Sparkles,
  pro: Zap,
  enterprise: Crown,
};

const planColors: Record<string, string> = {
  starter: 'bg-primary',
  pro: 'bg-success',
  enterprise: 'bg-warning',
};

export default function PlansPage() {
  const [availablePlans, setAvailablePlans] = useState<PlanDefinition[]>([]);
  const [currentPlanInfo, setCurrentPlanInfo] = useState<UserPlanInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const [plans, planInfo] = await Promise.all([
        getAvailablePlans(),
        getCurrentPlan(),
      ]);
      setAvailablePlans(Array.isArray(plans) ? plans : []);
      setCurrentPlanInfo(planInfo);
    } catch (err) {
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatFeatureValue = (value: number | 'unlimited' | null | undefined): string => {
    if (value === 'unlimited' || value === null || value === undefined) return 'Sınırsız';
    return Number(value).toLocaleString('tr-TR');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        <Skeleton className="h-32 w-full rounded-xl" />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <PlanCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const currentPlanId: string | null = currentPlanInfo?.currentPlan?.id ? String(currentPlanInfo.currentPlan.id) : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Planlar" description="Abonelik planlarını karşılaştırın ve ihtiyacınıza göre seçin" />

      {currentPlanInfo && currentPlanInfo.currentPlan ? (
        <Card className="bg-primary p-6 text-primary-foreground shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="mb-2 text-xl font-semibold">Aktif Planınız</h2>
              <p className="mb-2 text-2xl font-bold">{String(currentPlanInfo.currentPlan.name || 'Plan')}</p>
              <div className="text-sm text-primary-foreground/80">
                <span>Zamansız</span>
              </div>
            </div>
            <Link href="/dashboard/billing">
              <Button variant="outline" className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
                Fatura Geçmişi
              </Button>
            </Link>
          </div>
        </Card>
      ) : null}

      {availablePlans.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {availablePlans.map((plan: any, index: number) => {
            const planLevel: string = String(plan?.level || 'starter');
            const IconComponent = planIcons[planLevel];
            const Icon = (IconComponent && typeof IconComponent === 'function') ? IconComponent : Sparkles;
            const colorClass: string = planColors[planLevel] || 'bg-primary';
            const isCurrentPlan: boolean = currentPlanId ? String(plan?.id) === currentPlanId : false;
            const monthlyPrice: number = Number(plan?.price?.monthly) || 0;
            const yearlyPrice: number = Number(plan?.price?.yearly) || 0;
            const isPopular: boolean = Boolean(plan?.popular);

            return (
              <Card
                key={String(plan?.id || index)}
                className={`relative rounded-xl border-2 p-5 shadow-card transition-shadow hover:shadow-card-hover ${
                  isPopular
                    ? 'border-success shadow-elevated'
                    : isCurrentPlan
                    ? 'border-primary shadow-card-hover'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                {isPopular ? (
                  <div className="absolute left-0 right-0 top-0 rounded-t-[10px] bg-success py-1 text-center text-xs font-medium text-success-foreground">
                    EN POPÜLER
                  </div>
                ) : null}
                {isCurrentPlan ? (
                  <div className="absolute left-0 right-0 top-0 rounded-t-[10px] bg-primary py-1 text-center text-xs font-medium text-primary-foreground">
                    AKTİF PLAN
                  </div>
                ) : null}
                <div className={isPopular || isCurrentPlan ? 'pt-4' : ''}>
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${colorClass}`}>
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="mb-1 text-xl font-semibold text-foreground">{String(plan?.name || 'Plan')}</h3>
                  {plan?.description ? (
                    <p className="mb-3 text-sm text-muted-foreground">{String(plan.description)}</p>
                  ) : null}
                  <div className="mb-4">
                    <div className="mb-1 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">{formatPrice(monthlyPrice)}</span>
                      <span className="text-sm text-muted-foreground">/ay</span>
                    </div>
                    {yearlyPrice > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Yıllık: {formatPrice(Math.round(yearlyPrice / 12))}/ay
                        {(() => {
                          const totalMonthly = monthlyPrice * 12;
                          if (totalMonthly > 0) {
                            const discount = Math.max(0, 100 - Math.round((yearlyPrice / totalMonthly) * 100));
                            if (discount > 0) {
                              return <span className="ml-1 text-success">(%{String(discount)} indirim)</span>;
                            }
                          }
                          return null;
                        })()}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    className={`mb-4 w-full ${
                      isCurrentPlan
                        ? ''
                        : isPopular
                        ? 'bg-success text-success-foreground hover:bg-success/90'
                        : ''
                    }`}
                    variant={isCurrentPlan ? 'secondary' : 'default'}
                    disabled={isCurrentPlan}
                  >
                    <span>{isCurrentPlan ? 'Mevcut Plan' : planLevel === 'enterprise' ? 'İletişime Geç' : 'Planı Seç'}</span>
                    {!isCurrentPlan && planLevel !== 'enterprise' ? <ArrowRight /> : null}
                  </Button>
                  <div className="space-y-2">
                    {typeof plan?.features?.maxBlogs !== 'undefined' && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-success" />
                        <span className="text-sm">
                          {plan.features.maxBlogs === 'unlimited' || plan.features.maxBlogs === null
                            ? 'Sınırsız blog içeriği üretebilir'
                            : typeof plan.features.maxBlogs === 'number'
                            ? `Ayda ${plan.features.maxBlogs.toLocaleString('tr-TR')} blog içeriği üretebilir`
                            : 'Sınırsız blog içeriği üretebilir'}
                        </span>
                      </div>
                    )}
                    {typeof plan?.features?.maxTokensPerMonth !== 'undefined' && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-success" />
                        <span className="text-sm">
                          {plan.features.maxTokensPerMonth === 'unlimited' || plan.features.maxTokensPerMonth === null
                            ? 'Sınırsız token kullanabilir'
                            : typeof plan.features.maxTokensPerMonth === 'number'
                            ? `Ayda ${plan.features.maxTokensPerMonth.toLocaleString('tr-TR')} token kullanabilir`
                            : 'Sınırsız token kullanabilir'}
                        </span>
                      </div>
                    )}
                    {typeof plan?.features?.maxWorkspaces !== 'undefined' && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-success" />
                        <span className="text-sm">
                          {plan.features.maxWorkspaces === 'unlimited' || plan.features.maxWorkspaces === null
                            ? 'Sınırsız workspace oluşturabilir'
                            : typeof plan.features.maxWorkspaces === 'number'
                            ? `${plan.features.maxWorkspaces} workspace oluşturabilir`
                            : `${formatFeatureValue(plan.features.maxWorkspaces)} workspace oluşturabilir`}
                        </span>
                      </div>
                    )}
                    {plan?.features?.apiAccess ? (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-success" />
                        <span className="text-sm">API Erişimi</span>
                      </div>
                    ) : null}
                    {plan?.features?.prioritySupport ? (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-success" />
                        <span className="text-sm">Öncelikli Destek</span>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-sm">Destek: {String(plan?.features?.support || 'Standart')}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={<Crown />} title="Henüz plan bulunmamaktadır." />
      )}
    </div>
  );
}
