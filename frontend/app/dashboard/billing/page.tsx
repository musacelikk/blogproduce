'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  Gauge,
  Loader2,
  Package,
  Receipt,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton, StatsCardSkeleton, TableSkeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  getBillingHistory,
  getCurrentPlan,
  getEntitlement,
  getModelTiers,
  getTokenPacks,
  getTokenPurchases,
  purchaseTokenPack,
  type BillingHistoryItem,
  type Entitlement,
  type ModelTier,
  type TierInfo,
  type TokenPack,
  type TokenPurchase,
  type UserPlanInfo,
} from '@/lib/api';

/** Fallback labels for when /billing/tiers is unreachable. */
const TIER_FALLBACK: Record<ModelTier, string> = {
  standard: 'Standart',
  pro: 'Pro',
  premium: 'Premium',
};

const PURCHASE_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'outline' }> = {
  completed: { label: 'Tamamlandı', variant: 'success' },
  pending: { label: 'Beklemede', variant: 'warning' },
  refunded: { label: 'İade edildi', variant: 'outline' },
};

const SUBSCRIPTION_STATUS: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }
> = {
  active: { label: 'Aktif', variant: 'success' },
  pending: { label: 'Beklemede', variant: 'warning' },
  expired: { label: 'Süresi doldu', variant: 'destructive' },
  cancelled: { label: 'İptal edildi', variant: 'outline' },
};

const formatUsd = (value: number) => {
  const amount = Number(value) || 0;
  return `$${amount.toLocaleString('tr-TR', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatTokens = (value: number) => (Number(value) || 0).toLocaleString('tr-TR');

/** Compact form for the big number on a tile — "1,5M", "500K". */
const compactTokens = (value: number) => {
  const n = Number(value) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}M`;
  if (n >= 1_000) return `${(n / 1_000).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}K`;
  return n.toLocaleString('tr-TR');
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });

export default function BillingPage() {
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [planInfo, setPlanInfo] = useState<UserPlanInfo | null>(null);
  const [tiers, setTiers] = useState<TierInfo[]>([]);
  const [packs, setPacks] = useState<TokenPack[]>([]);
  const [purchases, setPurchases] = useState<TokenPurchase[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyingPackId, setBuyingPackId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ent, plan, tierList, packList, purchaseList, history] = await Promise.all([
        getEntitlement(),
        getCurrentPlan().catch(() => null),
        getModelTiers().catch(() => []),
        getTokenPacks().catch(() => []),
        getTokenPurchases().catch(() => []),
        getBillingHistory().catch(() => []),
      ]);
      setEntitlement(ent);
      setPlanInfo(plan);
      setTiers(Array.isArray(tierList) ? tierList : []);
      setPacks(Array.isArray(packList) ? packList.filter((p) => p.active !== false) : []);
      setPurchases(Array.isArray(purchaseList) ? purchaseList : []);
      setBillingHistory(Array.isArray(history) ? history : []);
    } catch (err) {
      console.error('Error loading billing data:', err);
      setError(err instanceof Error ? err.message : 'Faturalandırma bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pack: TokenPack) => {
    setBuyingPackId(pack.id);
    setNotice(null);
    try {
      await purchaseTokenPack(pack.id);
      const [ent, purchaseList] = await Promise.all([
        getEntitlement(),
        getTokenPurchases().catch(() => purchases),
      ]);
      setEntitlement(ent);
      setPurchases(Array.isArray(purchaseList) ? purchaseList : []);
      setNotice({
        type: 'success',
        text: `${pack.name} bakiyenize eklendi. ${formatTokens(pack.tokens)} token kullanıma hazır.`,
      });
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Satın alma tamamlanamadı, lütfen tekrar deneyin.',
      });
    } finally {
      setBuyingPackId(null);
    }
  };

  const tierLabel = (tier: ModelTier) => tiers.find((t) => t.tier === tier)?.label ?? TIER_FALLBACK[tier];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-44 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-border bg-destructive-muted p-5 text-sm text-destructive">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="mb-1 font-semibold">Faturalandırma bilgileri yüklenemedi</p>
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={loadBillingData} className="mt-3">
            Tekrar Dene
          </Button>
        </div>
      </div>
    );
  }

  const allowance = entitlement?.tokenAllowance ?? 0;
  const used = entitlement?.tokensUsedThisMonth ?? 0;
  const usedPct = allowance > 0 ? Math.min(100, (used / allowance) * 100) : used > 0 ? 100 : 0;
  const tokenBalance = entitlement?.tokenBalance ?? 0;
  const totalRemaining = entitlement?.totalTokensRemaining ?? 0;
  const articlesRemaining = entitlement?.estimatedArticlesRemaining ?? 0;
  const isTrial = Boolean(entitlement?.isTrial);
  const isExpired = Boolean(entitlement?.isExpired);

  const subscription = planInfo?.subscription ?? null;
  const billingPeriod = subscription?.billingPeriod ?? 'monthly';
  const planPrice = planInfo?.currentPlan
    ? billingPeriod === 'yearly'
      ? planInfo.currentPlan.price.yearly
      : planInfo.currentPlan.price.monthly
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faturalandırma"
        description="Planınızı, token kotanızı ve satın alımlarınızı tek yerden yönetin."
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/plans">
              <CreditCard />
              Planları karşılaştır
            </Link>
          </Button>
        }
      />

      {/* Current plan */}
      <Card variant={isExpired ? 'default' : 'emphasis'} className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-eyebrow">Mevcut plan</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-display-md text-foreground-strong">
                {entitlement?.planName ?? planInfo?.currentPlan?.name ?? 'Plan yok'}
              </h2>
              {isExpired ? (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3" />
                  Süresi doldu
                </Badge>
              ) : isTrial ? (
                <Badge variant="warning">
                  <Clock className="h-3 w-3" />
                  Deneme sürümü
                </Badge>
              ) : (
                <Badge variant="success">
                  <CheckCircle2 className="h-3 w-3" />
                  Aktif
                </Badge>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-2xl font-semibold tabular-nums text-foreground-strong">
                {isTrial || planPrice === 0 ? 'Ücretsiz' : formatUsd(planPrice)}
              </span>
              {!isTrial && planPrice > 0 && (
                <span className="text-sm text-muted-foreground">
                  / {billingPeriod === 'yearly' ? 'yıl' : 'ay'}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {isTrial && entitlement?.trialEndsAt && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="h-4 w-4" />
                  Deneme bitişi: {formatDate(entitlement.trialEndsAt)}
                  {entitlement.trialDaysRemaining != null && ` (${entitlement.trialDaysRemaining} gün kaldı)`}
                </span>
              )}
              {!isTrial && subscription?.expiresAt && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="h-4 w-4" />
                  {subscription.autoRenew ? 'Yenilenme' : 'Bitiş'} tarihi: {formatDate(subscription.expiresAt)}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-4 w-4" />
                Aylık {formatTokens(allowance)} token
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Package className="h-4 w-4" />
                {entitlement?.maxWorkspaces === 'unlimited'
                  ? 'Sınırsız workspace'
                  : `${entitlement?.maxWorkspaces ?? 0} workspace`}
              </span>
            </div>

            {entitlement && entitlement.allowedTiers.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Kalite seviyeleri:</span>
                {entitlement.allowedTiers.map((tier) => (
                  <Badge key={tier} variant={tier === entitlement.defaultTier ? 'primary' : 'outline'}>
                    {tierLabel(tier)}
                    {tier === entitlement.defaultTier ? ' · varsayılan' : ''}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 rounded-xl border border-border bg-card p-5 lg:w-72">
            <p className="text-sm font-medium text-muted-foreground">Kalan üretim kapasitesi</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground-strong">
              ≈ {formatTokens(articlesRemaining)} blog
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              ≈ {formatTokens(articlesRemaining)} blog daha üretebilirsiniz.
            </p>
            <Button asChild className="mt-4 w-full">
              <Link href="/dashboard/plans">
                {isExpired ? 'Plan seçin' : 'Planı yükselt'}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {isExpired && (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-destructive-muted p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Aboneliğiniz sona erdi</p>
            <p className="mt-0.5">
              Yeni blog üretebilmek için bir plan seçin veya mevcut token bakiyenizi kullanmak üzere paket satın alın.
            </p>
          </div>
        </div>
      )}

      {/* Quota meters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Aylık token kotası"
          value={compactTokens(used)}
          icon={<Gauge />}
          progress={usedPct}
          hint={`${formatTokens(allowance)} tokenin %${Math.round(usedPct)} kadarı kullanıldı`}
        />
        <StatCard
          label="Ek token bakiyesi"
          value={compactTokens(tokenBalance)}
          icon={<Wallet />}
          hint="Satın alınan tokenlar. Süresi dolmaz, aylık kotanız bittiğinde harcanır."
        />
        <StatCard
          label="Toplam kalan token"
          value={compactTokens(totalRemaining)}
          icon={<Zap />}
          hint={`Plan kotası ${formatTokens(entitlement?.tokensRemainingInPlan ?? 0)} + ek bakiye ${formatTokens(tokenBalance)}`}
        />
        <StatCard
          label="Kalan blog üretimi"
          value={`≈ ${formatTokens(articlesRemaining)}`}
          icon={<Sparkles />}
          hint={`≈ ${formatTokens(articlesRemaining)} blog daha üretebilirsiniz`}
        />
      </div>

      {/* Top-up packs */}
      <section>
        <div className="mb-4">
          <p className="text-eyebrow">Ek token</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground-strong">Token paketleri</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Kotanız yetmediğinde tek seferlik paket alın. Satın alınan tokenların süresi dolmaz ve yalnızca aylık
            kotanız bittikten sonra harcanır.
          </p>
        </div>

        {notice && (
          <div
            className={`mb-4 flex items-start gap-3 rounded-xl border border-border p-4 text-sm ${
              notice.type === 'success' ? 'bg-success-muted text-success' : 'bg-destructive-muted text-destructive'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p>{notice.text}</p>
          </div>
        )}

        {packs.length === 0 ? (
          <EmptyState
            icon={<Package />}
            title="Şu anda satın alınabilir paket yok"
            description="Token paketleri kısa süre içinde yeniden sunulacak."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {packs.map((pack) => {
              const isBuying = buyingPackId === pack.id;
              const pricePerMillion = pack.tokens > 0 ? (pack.priceUsd / pack.tokens) * 1_000_000 : 0;

              return (
                <Card
                  key={pack.id}
                  variant={pack.popular ? 'emphasis' : 'default'}
                  className="flex flex-col p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-foreground-strong">{pack.name}</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">{formatTokens(pack.tokens)} token</p>
                    </div>
                    {pack.popular && <Badge variant="primary">En çok tercih edilen</Badge>}
                  </div>

                  <div className="mt-5 flex items-baseline gap-1.5">
                    <span className="text-3xl font-semibold tabular-nums text-foreground-strong">
                      {formatUsd(pack.priceUsd)}
                    </span>
                    <span className="text-sm text-muted-foreground">tek seferlik</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    1M token başına {formatUsd(Math.round(pricePerMillion))}
                  </p>

                  <Button
                    className="mt-5 w-full"
                    variant={pack.popular ? 'default' : 'outline'}
                    onClick={() => handlePurchase(pack)}
                    disabled={isBuying || buyingPackId !== null}
                  >
                    {isBuying ? (
                      <>
                        <Loader2 className="animate-spin" />
                        İşleniyor…
                      </>
                    ) : (
                      <>
                        <Wallet />
                        Satın al
                      </>
                    )}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Top-up history */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <Receipt className="h-5 w-5 text-accent-foreground" />
          <h2 className="text-lg font-semibold text-foreground-strong">Token satın alımları</h2>
        </div>

        {purchases.length === 0 ? (
          <EmptyState
            icon={<Receipt />}
            title="Henüz token satın alımı yok"
            description="Satın aldığınız paketler ve tanımlanan tokenlar burada listelenir."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Paket</TableHead>
                <TableHead className="text-right">Token</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => {
                const status = PURCHASE_STATUS[purchase.status] ?? {
                  label: purchase.status,
                  variant: 'outline' as const,
                };
                return (
                  <TableRow key={purchase.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(purchase.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium text-foreground-strong">
                      {purchase.tokenPack?.name ?? purchase.note ?? 'Token tanımlaması'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatTokens(purchase.tokens)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatUsd(purchase.amountUsd)}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      {/* Subscription history */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-accent-foreground" />
          <h2 className="text-lg font-semibold text-foreground-strong">Abonelik geçmişi</h2>
        </div>

        {billingHistory.length === 0 ? (
          <EmptyState
            icon={<CreditCard />}
            title="Henüz abonelik kaydı yok"
            description="Bir plana geçtiğinizde abonelik dönemleriniz burada görünecek."
            action={
              <Button asChild>
                <Link href="/dashboard/plans">Planları görüntüle</Link>
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Dönem</TableHead>
                <TableHead>Başlangıç</TableHead>
                <TableHead>Bitiş</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billingHistory.map((item) => {
                const status = SUBSCRIPTION_STATUS[item.status] ?? {
                  label: item.status,
                  variant: 'outline' as const,
                };
                const price = item.billingPeriod === 'yearly' ? item.plan.price.yearly : item.plan.price.monthly;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-foreground-strong">{item.plan.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.billingPeriod === 'yearly' ? 'Yıllık' : 'Aylık'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(item.startedAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {item.expiresAt ? formatDate(item.expiresAt) : 'Süresiz'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatUsd(price)}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
