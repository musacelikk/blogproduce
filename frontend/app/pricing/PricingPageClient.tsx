'use client';

import { motion } from 'framer-motion';
import { Check, X, Zap, Shield, Headphones, ArrowRight } from 'lucide-react';
import { PlanDefinition } from '@/lib/api';
import Link from 'next/link';
import { trackButtonClick, trackCustomEvent } from '@/lib/analytics';

interface PricingPageClientProps {
  plans: PlanDefinition[];
}

type PlanLevel = 'starter' | 'pro' | 'enterprise';

interface FeatureComparison {
  category: string;
  features: {
    name: string;
    plan1: boolean | string; // Cheapest plan (leftmost)
    plan2: boolean | string; // Middle plan
    plan3: boolean | string; // Most expensive plan (rightmost)
  }[];
}

function formatFeature(value: boolean | number | string | 'unlimited' | undefined): boolean | string {
  if (value === undefined || value === false) return false;
  if (value === true) return true;
  if (value === 'unlimited') return 'Sınırsız';
  if (typeof value === 'number') return value.toLocaleString('tr-TR');
  return value;
}

function getFeatureComparison(plans: PlanDefinition[]): FeatureComparison[] {
  // Sort plans by monthly price (ascending - cheapest first, left to right)
  const sortedPlans = [...plans].sort((a, b) => {
    const priceA = a.price?.monthly || 0;
    const priceB = b.price?.monthly || 0;
    return priceA - priceB;
  });

  // Get plans in price order (cheapest first = leftmost)
  const [plan1, plan2, plan3] = sortedPlans;

  return [
    {
      category: 'İçerik Üretimi',
      features: [
        {
          name: 'Aylık Blog İçeriği',
          plan1: formatFeature(plan1?.features.maxBlogs) === 'Sınırsız'
            ? 'Sınırsız blog içeriği üretebilir'
            : formatFeature(plan1?.features.maxBlogs) === false
            ? false
            : `Ayda ${formatFeature(plan1?.features.maxBlogs)} blog içeriği üretebilir`,
          plan2: formatFeature(plan2?.features.maxBlogs) === 'Sınırsız'
            ? 'Sınırsız blog içeriği üretebilir'
            : formatFeature(plan2?.features.maxBlogs) === false
            ? false
            : `Ayda ${formatFeature(plan2?.features.maxBlogs)} blog içeriği üretebilir`,
          plan3: formatFeature(plan3?.features.maxBlogs) === 'Sınırsız'
            ? 'Sınırsız blog içeriği üretebilir'
            : formatFeature(plan3?.features.maxBlogs) === false
            ? false
            : `Ayda ${formatFeature(plan3?.features.maxBlogs)} blog içeriği üretebilir`,
        },
        {
          name: 'Aylık Token Limiti',
          plan1: formatFeature(plan1?.features.maxTokensPerMonth) === 'Sınırsız'
            ? 'Sınırsız token kullanabilir'
            : formatFeature(plan1?.features.maxTokensPerMonth) === false
            ? false
            : `Ayda ${formatFeature(plan1?.features.maxTokensPerMonth)} token kullanabilir`,
          plan2: formatFeature(plan2?.features.maxTokensPerMonth) === 'Sınırsız'
            ? 'Sınırsız token kullanabilir'
            : formatFeature(plan2?.features.maxTokensPerMonth) === false
            ? false
            : `Ayda ${formatFeature(plan2?.features.maxTokensPerMonth)} token kullanabilir`,
          plan3: formatFeature(plan3?.features.maxTokensPerMonth) === 'Sınırsız'
            ? 'Sınırsız token kullanabilir'
            : formatFeature(plan3?.features.maxTokensPerMonth) === false
            ? false
            : `Ayda ${formatFeature(plan3?.features.maxTokensPerMonth)} token kullanabilir`,
        },
        {
          name: 'Workspace Oluşturma',
          plan1: formatFeature(plan1?.features.maxWorkspaces) === 'Sınırsız' 
            ? 'Sınırsız workspace oluşturabilir'
            : formatFeature(plan1?.features.maxWorkspaces) === false
            ? false
            : `${formatFeature(plan1?.features.maxWorkspaces)} workspace oluşturabilir`,
          plan2: formatFeature(plan2?.features.maxWorkspaces) === 'Sınırsız'
            ? 'Sınırsız workspace oluşturabilir'
            : formatFeature(plan2?.features.maxWorkspaces) === false
            ? false
            : `${formatFeature(plan2?.features.maxWorkspaces)} workspace oluşturabilir`,
          plan3: formatFeature(plan3?.features.maxWorkspaces) === 'Sınırsız'
            ? 'Sınırsız workspace oluşturabilir'
            : formatFeature(plan3?.features.maxWorkspaces) === false
            ? false
            : `${formatFeature(plan3?.features.maxWorkspaces)} workspace oluşturabilir`,
        },
        {
          name: 'Resimli Blog Üretimi',
          plan1: true,
          plan2: true,
          plan3: true,
        },
        {
          name: 'Toplu İşlem',
          plan1: true,
          plan2: true,
          plan3: true,
        },
      ],
    },
    {
      category: 'Teknik Özellikler',
      features: [
        {
          name: 'RESTful API Erişimi',
          plan1: plan1?.features.apiAccess || false,
          plan2: plan2?.features.apiAccess || false,
          plan3: plan3?.features.apiAccess || false,
        },
        {
          name: 'Webhook Entegrasyonları',
          plan1: plan1?.features.webhookAccess || false,
          plan2: plan2?.features.webhookAccess || false,
          plan3: plan3?.features.webhookAccess || false,
        },
        {
          name: 'Dil Desteği',
          plan1: plan1?.features.languages?.length ? `${plan1.features.languages.length}+ dil` : false,
          plan2: plan2?.features.languages?.length ? `${plan2.features.languages.length}+ dil` : false,
          plan3: plan3?.features.languages?.length ? `${plan3.features.languages.length}+ dil` : false,
        },
        {
          name: 'Gelişmiş SEO Optimizasyonu',
          plan1: plan1?.features.advancedSeo || false,
          plan2: plan2?.features.advancedSeo || false,
          plan3: plan3?.features.advancedSeo || false,
        },
        {
          name: 'Analytics Dashboard',
          plan1: plan1?.features.analytics || false,
          plan2: plan2?.features.analytics || false,
          plan3: plan3?.features.analytics || false,
        },
      ],
    },
    {
      category: 'Destek ve Hizmetler',
      features: [
        {
          name: 'Müşteri Desteği',
          plan1: plan1?.features.support || false,
          plan2: plan2?.features.support || false,
          plan3: plan3?.features.support || false,
        },
        {
          name: 'Öncelikli Destek',
          plan1: plan1?.features.prioritySupport || false,
          plan2: plan2?.features.prioritySupport || false,
          plan3: plan3?.features.prioritySupport || false,
        },
        {
          name: 'Özel Hesap Yöneticisi',
          plan1: plan1?.features.accountManager || false,
          plan2: plan2?.features.accountManager || false,
          plan3: plan3?.features.accountManager || false,
        },
        {
          name: 'Özel AI Model Eğitimi',
          plan1: plan1?.features.customTraining || false,
          plan2: plan2?.features.customTraining || false,
          plan3: plan3?.features.customTraining || false,
        },
        {
          name: 'Özel Marka Uyumu',
          plan1: plan1?.features.customBranding || false,
          plan2: plan2?.features.customBranding || false,
          plan3: plan3?.features.customBranding || false,
        },
      ],
    },
  ];
}

export function PricingPageClient({ plans }: PricingPageClientProps) {
  // If no plans, show empty state
  if (plans.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <main className="w-full px-4 md:px-6 lg:px-8 pt-20 md:pt-24 lg:pt-32 pb-12 md:pb-16">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center">
              <h1
                className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground mb-4 md:mb-6"
              >
                Fiyatlandırma
              </h1>
              <p
                className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto"
              >
                Planlar yakında eklenecek.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Sort plans by monthly price (ascending - cheapest first, left to right)
  const sortedPlans = [...plans].sort((a, b) => {
    const priceA = a.price?.monthly || 0;
    const priceB = b.price?.monthly || 0;
    return priceA - priceB;
  });

  const featureComparison = getFeatureComparison(plans);
  
  // Get sorted plans for table headers (cheapest first)
  const sortedPlansForTable = [...plans].sort((a, b) => {
    const priceA = a.price?.monthly || 0;
    const priceB = b.price?.monthly || 0;
    return priceA - priceB;
  });

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full px-4 md:px-6 lg:px-8 pt-20 md:pt-24 lg:pt-32 pb-12 md:pb-16">
        <div className="max-w-[1280px] mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 md:mb-16"
          >
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-5"
              style={{ background: 'linear-gradient(135deg,#203eec18,#00d4ff18)', color: '#203eec' }}
            >
              Fiyatlandırma
            </span>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">
              İhtiyacına uygun planı seç
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Tüm planlarda 14 gün ücretsiz deneme ve iptal garantisi. Kredi kartı gerekmez.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
              {[
                { icon: Shield, label: 'Güvenli Ödeme' },
                { icon: Zap, label: 'Anında Aktivasyon' },
                { icon: Headphones, label: '7/24 Destek' },
              ].map(({ icon: Icon, label }) => (
                <div key={label}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium"
                  style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)', backgroundColor: 'var(--card)' }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: '#203eec' }} />
                  {label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16 lg:mb-20">
            {sortedPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative bg-card border rounded-2xl md:rounded-[30px] lg:rounded-3xl p-5 md:p-6 lg:p-8 flex flex-col ${
                  plan.popular
                    ? 'border-[#203eec] bg-[#203eec]/5 shadow-lg shadow-[#203eec]/20 lg:scale-105'
                    : 'border-border hover:border-[#203eec]/50'
                } transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 md:-top-3 left-1/2 -translate-x-1/2 z-10">
                    <span
                      className="bg-[#203eec] text-white px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-semibold"
                    >
                      En Popüler
                    </span>
                  </div>
                )}
                <div className="mb-4 md:mb-6">
                  <h3
                    className="text-xl md:text-2xl font-medium mb-2 text-foreground"
                  >
                    {plan.name}
                  </h3>
                  {plan.description && (
                    <p
                      className="text-muted-foreground mb-3 md:mb-4 text-xs md:text-sm"
                    >
                      {plan.description}
                    </p>
                  )}
                  <div className="flex items-baseline gap-1 mb-2">
                    <span
                      className="text-4xl md:text-5xl font-medium text-foreground"
                    >
                      {plan.price.monthly.toLocaleString('tr-TR')}$
                    </span>
                    <span
                      className="text-base md:text-lg text-muted-foreground"
                    >
                      /ay
                    </span>
                  </div>
                  {plan.price.yearly > 0 && plan.price.monthly > 0 && (
                    <p
                      className="text-sm text-muted-foreground"
                    >
                      Yıllık: {Math.round(plan.price.yearly / 12).toLocaleString('tr-TR')}$/ay
                      {(() => {
                        const fullYear = plan.price.monthly * 12;
                        const discount =
                          fullYear > 0
                            ? Math.max(
                                0,
                                100 - Math.round((plan.price.yearly / fullYear) * 100),
                              )
                            : 0;
                        return discount > 0 ? (
                          <span className="text-green-600 ml-1">
                            (%{discount} indirim)
                          </span>
                        ) : null;
                      })()}
                    </p>
                  )}
                </div>
                <ul className="space-y-2.5 md:space-y-3 mb-6 md:mb-8 flex-grow">
                  {typeof plan.features.maxBlogs !== 'undefined' && (
                    <li className="flex items-start">
                      <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#203eec] flex items-center justify-center mr-2.5 md:mr-3 flex-shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                      </div>
                      <span
                        className="text-xs md:text-sm text-foreground"
                      >
                        {typeof plan.features.maxBlogs === 'number'
                          ? `Ayda ${plan.features.maxBlogs.toLocaleString('tr-TR')} blog içeriği üretebilir`
                          : 'Sınırsız blog içeriği üretebilir'}
                      </span>
                    </li>
                  )}
                  {typeof plan.features.maxTokensPerMonth !== 'undefined' && (
                    <li className="flex items-start">
                      <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#203eec] flex items-center justify-center mr-2.5 md:mr-3 flex-shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                      </div>
                      <span
                        className="text-xs md:text-sm text-foreground"
                      >
                        {typeof plan.features.maxTokensPerMonth === 'number'
                          ? `Ayda ${plan.features.maxTokensPerMonth.toLocaleString('tr-TR')} token kullanabilir`
                          : 'Sınırsız token kullanabilir'}
                      </span>
                    </li>
                  )}
                  {typeof plan.features.maxWorkspaces !== 'undefined' && (
                    <li className="flex items-start">
                      <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#203eec] flex items-center justify-center mr-2.5 md:mr-3 flex-shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                      </div>
                      <span
                        className="text-xs md:text-sm text-foreground"
                      >
                        {typeof plan.features.maxWorkspaces === 'number'
                          ? `${plan.features.maxWorkspaces} workspace oluşturabilir`
                          : plan.features.maxWorkspaces === 'unlimited'
                          ? 'Sınırsız workspace oluşturabilir'
                          : 'Workspace oluşturabilir'}
                      </span>
                    </li>
                  )}
                  {plan.features.apiAccess && (
                    <li className="flex items-start">
                      <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#203eec] flex items-center justify-center mr-2.5 md:mr-3 flex-shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                      </div>
                      <span
                        className="text-xs md:text-sm text-foreground"
                      >
                        RESTful API erişimi
                      </span>
                    </li>
                  )}
                  {plan.features.languages && plan.features.languages.length > 0 && (
                    <li className="flex items-start">
                      <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#203eec] flex items-center justify-center mr-2.5 md:mr-3 flex-shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                      </div>
                      <span
                        className="text-xs md:text-sm text-foreground"
                      >
                        {plan.features.languages.length > 10
                          ? '50+ dil desteği'
                          : `${plan.features.languages.length}+ dil desteği`}
                      </span>
                    </li>
                  )}
                  {plan.features.support && (
                    <li className="flex items-start">
                      <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#203eec] flex items-center justify-center mr-2.5 md:mr-3 flex-shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                      </div>
                      <span
                        className="text-xs md:text-sm text-foreground"
                      >
                        {plan.features.support}
                      </span>
                    </li>
                  )}
                </ul>
                <Link
                  href={plan.level === 'enterprise' ? '/contact' : '/register'}
                  onClick={() => {
                    trackButtonClick(plan.level === 'enterprise' ? 'contact_enterprise' : `select_plan_${plan.level}`, '/pricing');
                    trackCustomEvent('plan_selection', {
                      plan_name: plan.name,
                      plan_level: plan.level,
                      plan_id: plan.id,
                    });
                  }}
                  className={`w-full py-2.5 md:py-3 px-5 md:px-6 rounded-full text-sm md:text-base font-semibold transition-all text-center ${
                    plan.popular
                      ? 'bg-[#203eec] text-white hover:bg-[#1a32cc]'
                      : 'bg-secondary text-foreground hover:bg-secondary/80'
                  } hover:rounded-2xl flex items-center justify-center gap-2`}
                >
                  {plan.level === 'enterprise' ? 'İletişime Geç' : 'Başla'}
                  <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Feature Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12 md:mb-16 lg:mb-20"
          >
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 md:mb-8 text-center text-foreground">
              Özellik Karşılaştırması
            </h2>
            <div className="bg-card border border-border rounded-2xl md:rounded-[30px] lg:rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[640px] sm:min-w-0">
                  {/* Table Header with Plan Names */}
                  <div className="grid grid-cols-4 gap-3 md:gap-4 lg:gap-6 px-3 md:px-4 lg:px-6 py-3 md:py-4 bg-secondary/50 border-b border-border">
                    <div className="col-span-1">
                      <span
                        className="text-xs md:text-sm font-semibold text-foreground"
                      >
                        Özellik
                      </span>
                    </div>
                    {sortedPlansForTable.map((plan, index) => (
                      <div key={plan.id} className="col-span-1 text-center">
                        <span
                          className="text-xs md:text-sm font-semibold text-foreground"
                        >
                          {plan.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  {featureComparison.map((category, categoryIndex) => (
                    <div key={categoryIndex} className={categoryIndex > 0 ? 'border-t border-border' : ''}>
                      <div className="bg-secondary/50 px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4">
                        <h3
                          className="text-base md:text-lg font-semibold text-foreground"
                        >
                          {category.category}
                        </h3>
                      </div>
                      <div className="divide-y divide-border">
                        {category.features.map((feature, featureIndex) => (
                          <div
                            key={featureIndex}
                            className="grid grid-cols-4 gap-3 md:gap-4 lg:gap-6 px-3 md:px-4 lg:px-6 py-3 md:py-4 hover:bg-secondary/30 transition-colors"
                          >
                            <div className="col-span-1 flex items-center min-w-[140px] sm:min-w-0">
                              <span
                                className="text-xs md:text-sm text-foreground font-medium"
                              >
                                {feature.name}
                              </span>
                            </div>
                            <div className="col-span-1 flex items-center justify-center min-w-[100px] sm:min-w-0">
                              {feature.plan1 === false ? (
                                <X className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                              ) : typeof feature.plan1 === 'string' ? (
                                <span
                                  className="text-xs md:text-sm text-foreground text-center break-words"
                                >
                                  {feature.plan1}
                                </span>
                              ) : (
                                <Check className="w-4 h-4 md:w-5 md:h-5 text-[#203eec] flex-shrink-0" />
                              )}
                            </div>
                            <div className="col-span-1 flex items-center justify-center min-w-[100px] sm:min-w-0">
                              {feature.plan2 === false ? (
                                <X className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                              ) : typeof feature.plan2 === 'string' ? (
                                <span
                                  className="text-xs md:text-sm text-foreground text-center break-words"
                                >
                                  {feature.plan2}
                                </span>
                              ) : (
                                <Check className="w-4 h-4 md:w-5 md:h-5 text-[#203eec] flex-shrink-0" />
                              )}
                            </div>
                            <div className="col-span-1 flex items-center justify-center min-w-[100px] sm:min-w-0">
                              {feature.plan3 === false ? (
                                <X className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                              ) : typeof feature.plan3 === 'string' ? (
                                <span
                                  className="text-xs md:text-sm text-foreground text-center break-words"
                                >
                                  {feature.plan3}
                                </span>
                              ) : (
                                <Check className="w-4 h-4 md:w-5 md:h-5 text-[#203eec] flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>


          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="relative overflow-hidden rounded-2xl md:rounded-3xl p-8 md:p-14 text-center"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[280px] rounded-full opacity-10 blur-3xl pointer-events-none"
              style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }} />
            <div className="relative">
              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#203eec' }}>
                Hemen başlayın
              </p>
              <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground mb-4 max-w-xl mx-auto leading-tight">
                14 gün ücretsiz, iptal garantili
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-lg mx-auto">
                BlogGenerator ile içerik üretimini hızlandırın. Risk almadan deneyin.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg,#203eec,#00d4ff)' }}
                >
                  Ücretsiz Deneme Başlat
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 hover:border-[#203eec] hover:text-[#203eec]"
                  style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
                >
                  İletişime Geç
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
