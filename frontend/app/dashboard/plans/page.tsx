'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Crown, ArrowRight, Loader2, Infinity, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlanCardSkeleton } from '@/components/ui/skeleton';
import { getAvailablePlans, getCurrentPlan, type PlanDefinition, type UserPlanInfo } from '@/lib/api';

const planIcons: Record<string, any> = {
  starter: Sparkles,
  pro: Zap,
  enterprise: Crown,
};

const planColors: Record<string, string> = {
  starter: 'bg-[#203eec]',
  pro: 'bg-[#10B981]',
  enterprise: 'bg-[#F59E0B]',
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
        <div className="mb-6">
          <div className="h-8 w-64 bg-[#e5e5e5] animate-pulse rounded mb-2" />
          <div className="h-4 w-96 bg-[#e5e5e5] animate-pulse rounded" />
        </div>

        <div className="bg-gradient-to-r from-[#203eec] to-[#1a32cc] rounded-xl p-6">
          <div className="h-6 w-32 bg-white/20 animate-pulse rounded mb-2" />
          <div className="h-8 w-40 bg-white/20 animate-pulse rounded mb-2" />
          <div className="h-4 w-24 bg-white/20 animate-pulse rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
        {currentPlanInfo && currentPlanInfo.currentPlan ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-gradient-to-r from-[#203eec] to-[#1a32cc] rounded-xl p-6 text-white"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Aktif Planınız</h2>
                <p className="text-2xl font-bold mb-2">{String(currentPlanInfo.currentPlan.name || 'Plan')}</p>
                <div className="text-sm opacity-90">
                  <span>Zamansız</span>
                </div>
              </div>
              <Link href="/dashboard/billing">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Fatura Geçmişi
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : null}
        
        {availablePlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {availablePlans.map((plan: any, index: number) => {
            const planLevel: string = String(plan?.level || 'starter');
            const IconComponent = planIcons[planLevel];
            const Icon = (IconComponent && typeof IconComponent === 'function') ? IconComponent : Sparkles;
            const colorClass: string = planColors[planLevel] || 'bg-[#203eec]';
            const isCurrentPlan: boolean = currentPlanId ? String(plan?.id) === currentPlanId : false;
            const monthlyPrice: number = Number(plan?.price?.monthly) || 0;
            const yearlyPrice: number = Number(plan?.price?.yearly) || 0;
            const isPopular: boolean = Boolean(plan?.popular);

            return (
              <motion.div
                key={String(plan?.id || index)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                className={`bg-white rounded-xl border-2 p-5 relative ${
                  isPopular
                    ? 'border-[#10B981] shadow-lg'
                    : isCurrentPlan
                    ? 'border-[#203eec]'
                    : 'border-[#e5e5e5]'
                }`}
              >
                {isPopular ? (
                  <div className="absolute top-0 left-0 right-0 bg-[#10B981] text-white text-center py-1 text-xs font-medium rounded-t-xl">
                    EN POPÜLER
                  </div>
                ) : null}
                {isCurrentPlan ? (
                  <div className="absolute top-0 left-0 right-0 bg-[#203eec] text-white text-center py-1 text-xs font-medium rounded-t-xl">
                    AKTİF PLAN
                  </div>
                ) : null}
                <div className={isPopular || isCurrentPlan ? 'pt-4' : ''}>
                <div className={`w-12 h-12 ${colorClass} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                 <h3 className="text-xl font-semibold text-[#202020] mb-1">{String(plan?.name || 'Plan')}</h3>
                 {plan?.description ? (
                   <p className="text-sm text-[#666666] mb-3">{String(plan.description)}</p>
                 ) : null}
                 <div className="mb-4">
                   <div className="flex items-baseline gap-1 mb-1">
                     <span className="text-3xl font-bold text-[#202020]">{formatPrice(monthlyPrice)}</span>
                     <span className="text-sm text-[#666666]">/ay</span>
                   </div>
                   {yearlyPrice > 0 ? (
                     <p className="text-xs text-[#666666]">
                       Yıllık: {formatPrice(Math.round(yearlyPrice / 12))}/ay
                       {(() => {
                         const totalMonthly = monthlyPrice * 12;
                         if (totalMonthly > 0) {
                           const discount = Math.max(0, 100 - Math.round((yearlyPrice / totalMonthly) * 100));
                           if (discount > 0) {
                             return <span className="text-green-600 ml-1">(%{String(discount)} indirim)</span>;
                           }
                         }
                         return null;
                       })()}
                     </p>
                   ) : null}
                 </div>
                 <Button
                   className={`w-full mb-4 rounded-full ${
                     isCurrentPlan
                       ? 'bg-gray-400 hover:bg-gray-500 text-white cursor-not-allowed'
                       : isPopular
                       ? 'bg-[#10B981] hover:bg-[#059669] text-white'
                       : 'bg-[#203eec] hover:bg-[#1a32cc] text-white'
                   }`}
                   disabled={isCurrentPlan}
                 >
                   <span>{isCurrentPlan ? 'Mevcut Plan' : planLevel === 'enterprise' ? 'İletişime Geç' : 'Planı Seç'}</span>
                   {!isCurrentPlan && planLevel !== 'enterprise' ? <ArrowRight className="w-4 h-4 ml-2" /> : null}
                 </Button>
                 <div className="space-y-2">
                   {typeof plan?.features?.maxBlogs !== 'undefined' && (
                     <div className="flex items-center gap-2">
                       <Check className="w-4 h-4 text-green-600" />
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
                       <Check className="w-4 h-4 text-green-600" />
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
                       <Check className="w-4 h-4 text-green-600" />
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
                       <Check className="w-4 h-4 text-green-600" />
                       <span className="text-sm">API Erişimi</span>
                     </div>
                   ) : null}
                   {plan?.features?.prioritySupport ? (
                     <div className="flex items-center gap-2">
                       <Check className="w-4 h-4 text-green-600" />
                       <span className="text-sm">Öncelikli Destek</span>
                     </div>
                   ) : null}
                   <div className="flex items-center gap-2">
                     <Check className="w-4 h-4 text-green-600" />
                     <span className="text-sm">Destek: {String(plan?.features?.support || 'Standart')}</span>
                   </div>
                 </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <p>Henüz plan bulunmamaktadır.</p>
      )}
    </div>
  );
}
