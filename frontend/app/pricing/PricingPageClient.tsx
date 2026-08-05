'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Check, Minus, Zap, Shield, Headphones, ArrowRight } from 'lucide-react';
import { PlanDefinition } from '@/lib/api';
import Link from 'next/link';
import { trackButtonClick, trackCustomEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';
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

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === false) {
    return <Minus className="mx-auto h-4 w-4 text-muted-foreground" />;
  }
  if (typeof value === 'string') {
    return <span className="block text-center text-xs md:text-sm">{value}</span>;
  }
  return (
    <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary">
      <Check className="h-3.5 w-3.5 text-primary-foreground" />
    </span>
  );
}

export function PricingPageClient({ plans }: PricingPageClientProps) {
  // If no plans, show empty state
  if (plans.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <main className="w-full px-4 pb-16 pt-32 sm:px-6 sm:pb-24 sm:pt-40 lg:px-8">
          <div className="mx-auto max-w-7xl text-center">
            <h1 className="mb-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Fiyatlandırma
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Planlar yakında eklenecek.
            </p>
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
      <main className="w-full px-4 pb-16 pt-32 sm:px-6 sm:pb-24 sm:pt-40 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center sm:mb-16"
          >
            <Badge className="mb-5 uppercase tracking-wide">Fiyatlandırma</Badge>
            <h1 className="mb-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              İhtiyacına uygun planı seç
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              Tüm planlarda 14 gün ücretsiz deneme ve iptal garantisi. Kredi kartı gerekmez.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { icon: Shield, label: 'Güvenli Ödeme' },
                { icon: Zap, label: 'Anında Aktivasyon' },
                { icon: Headphones, label: '7/24 Destek' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Plans Grid */}
          <div className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:mb-24">
            {sortedPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={cn(
                  'relative flex flex-col rounded-xl border bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover lg:p-8',
                  plan.popular ? 'border-primary shadow-card-hover' : 'border-border',
                )}
              >
                {plan.popular && (
                  <Badge variant="primary" className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                    En Popüler
                  </Badge>
                )}
                <div className="mb-6">
                  <h3 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
                    {plan.name}
                  </h3>
                  {plan.description && (
                    <p className="mb-4 text-sm text-muted-foreground">{plan.description}</p>
                  )}
                  <div className="mb-2 flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                      {plan.price.monthly.toLocaleString('tr-TR')}$
                    </span>
                    <span className="text-base text-muted-foreground">/ay</span>
                  </div>
                  {plan.price.yearly > 0 && plan.price.monthly > 0 && (
                    <p className="text-sm text-muted-foreground">
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
                          <span className="ml-1 font-medium text-success">
                            (%{discount} indirim)
                          </span>
                        ) : null;
                      })()}
                    </p>
                  )}
                </div>
                <ul className="mb-8 flex-grow space-y-3">
                  {typeof plan.features.maxBlogs !== 'undefined' && (
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent">
                        <Check className="h-3 w-3 text-accent-foreground" />
                      </span>
                      <span className="text-sm text-foreground">
                        {typeof plan.features.maxBlogs === 'number'
                          ? `Ayda ${plan.features.maxBlogs.toLocaleString('tr-TR')} blog içeriği üretebilir`
                          : 'Sınırsız blog içeriği üretebilir'}
                      </span>
                    </li>
                  )}
                  {typeof plan.features.maxTokensPerMonth !== 'undefined' && (
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent">
                        <Check className="h-3 w-3 text-accent-foreground" />
                      </span>
                      <span className="text-sm text-foreground">
                        {typeof plan.features.maxTokensPerMonth === 'number'
                          ? `Ayda ${plan.features.maxTokensPerMonth.toLocaleString('tr-TR')} token kullanabilir`
                          : 'Sınırsız token kullanabilir'}
                      </span>
                    </li>
                  )}
                  {typeof plan.features.maxWorkspaces !== 'undefined' && (
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent">
                        <Check className="h-3 w-3 text-accent-foreground" />
                      </span>
                      <span className="text-sm text-foreground">
                        {typeof plan.features.maxWorkspaces === 'number'
                          ? `${plan.features.maxWorkspaces} workspace oluşturabilir`
                          : plan.features.maxWorkspaces === 'unlimited'
                          ? 'Sınırsız workspace oluşturabilir'
                          : 'Workspace oluşturabilir'}
                      </span>
                    </li>
                  )}
                  {plan.features.apiAccess && (
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent">
                        <Check className="h-3 w-3 text-accent-foreground" />
                      </span>
                      <span className="text-sm text-foreground">RESTful API erişimi</span>
                    </li>
                  )}
                  {plan.features.languages && plan.features.languages.length > 0 && (
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent">
                        <Check className="h-3 w-3 text-accent-foreground" />
                      </span>
                      <span className="text-sm text-foreground">
                        {plan.features.languages.length > 10
                          ? '50+ dil desteği'
                          : `${plan.features.languages.length}+ dil desteği`}
                      </span>
                    </li>
                  )}
                  {plan.features.support && (
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent">
                        <Check className="h-3 w-3 text-accent-foreground" />
                      </span>
                      <span className="text-sm text-foreground">{plan.features.support}</span>
                    </li>
                  )}
                </ul>
                <Button
                  asChild
                  variant={plan.popular ? 'default' : 'secondary'}
                  className="w-full"
                >
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
                  >
                    {plan.level === 'enterprise' ? 'İletişime Geç' : 'Başla'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>

          {/* Feature Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16 lg:mb-24"
          >
            <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Özellik Karşılaştırması
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Özellik</TableHead>
                  {sortedPlansForTable.map((plan) => (
                    <TableHead key={plan.id} className="min-w-[120px] text-center">
                      {plan.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureComparison.map((category) => (
                  <React.Fragment key={category.category}>
                    <TableRow className="hover:bg-secondary">
                      <TableCell
                        colSpan={sortedPlansForTable.length + 1}
                        className="bg-secondary text-sm font-semibold"
                      >
                        {category.category}
                      </TableCell>
                    </TableRow>
                    {category.features.map((feature) => (
                      <TableRow key={`${category.category}-${feature.name}`}>
                        <TableCell className="text-sm font-medium">{feature.name}</TableCell>
                        <TableCell className="text-center">
                          <FeatureValue value={feature.plan1} />
                        </TableCell>
                        <TableCell className="text-center">
                          <FeatureValue value={feature.plan2} />
                        </TableCell>
                        <TableCell className="text-center">
                          <FeatureValue value={feature.plan3} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="rounded-xl border border-border bg-accent p-8 text-center md:p-14"
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
              Hemen başlayın
            </p>
            <h2 className="mx-auto mb-4 max-w-xl text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
              14 gün ücretsiz, iptal garantili
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-base text-muted-foreground">
              BlogProduce ile içerik üretimini hızlandırın. Risk almadan deneyin.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  Ücretsiz Deneme Başlat
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">İletişime Geç</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
