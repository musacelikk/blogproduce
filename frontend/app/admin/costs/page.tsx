'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeftRight,
  Calculator,
  Coins,
  Cpu,
  FileText,
  Info,
  Layers,
  Loader2,
  Percent,
  PiggyBank,
  RefreshCw,
  Server,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getCostAnalysis,
  projectPlanEconomics,
  type CostAnalysis,
  type ModelTier,
  type PlanProjection,
} from '@/lib/api';
import { formatPercent, formatTokens, formatTry, formatUsd } from '@/lib/currency';

const SELECT_CLASS =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground transition-colors hover:border-strong focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20';

const LABEL_CLASS = 'mb-1.5 block text-xs font-medium text-muted-foreground';

/* ── Para birimi ──────────────────────────────────────────────────────────
 * Bu ekranda iki para birimi yan yana durur ve asla toplanmaz:
 *   • Sağlayıcı maliyeti  → USD (OpenAI bizi dolarla faturalar)
 *   • Gelir / fiyat / kâr → TRY (müşteri lira öder)
 * Dönüşüm, backend'in `USD_TRY_RATE` ile hesapladığı `exchangeRate` üzerinden
 * yapılır; sayfadaki her marj bu kura bağlıdır. Bu yüzden biçimlendirme
 * yardımcıları `lib/currency.ts` içinden gelir — burada yeniden tanımlanmaz.
 */

/** Adet/sayı alanları (blog, üretim, abonelik) — para değil, kısaltılmaz. */
function count(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString('tr-TR');
}

/**
 * API'nin yalnızca USD döndürdüğü sağlayıcı maliyetleri için TRY karşılığı.
 * Backend ile aynı kuru kullanır, dolayısıyla aynı sonucu verir.
 */
function usdToTry(value: number | null | undefined, rate: number): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return value * rate;
}

/** Marj renk eşiği: %70+ sağlıklı · %50–70 izlenmeli · %50 altı riskli. */
function marginTone(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'text-muted-foreground';
  }
  if (value >= 70) return 'text-success';
  if (value >= 50) return 'text-warning';
  return 'text-destructive';
}

const TIER_BADGE: Record<string, 'outline' | 'info' | 'primary'> = {
  standard: 'outline',
  pro: 'info',
  premium: 'primary',
};

/** Son 12 ay, YYYY-MM. */
function buildMonthOptions(): { value: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    return { value, label };
  });
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-eyebrow">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-semibold text-foreground-strong">{title}</h2>
        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** TRY birincil, USD ikincil — sağlayıcı maliyeti gösteriminin standart biçimi. */
function CostCell({
  amountTry,
  amountUsd,
  emphasis = false,
}: {
  amountTry: number | null | undefined;
  amountUsd: number | null | undefined;
  emphasis?: boolean;
}) {
  return (
    <>
      <span
        className={
          emphasis
            ? 'font-semibold tabular-nums text-foreground-strong'
            : 'tabular-nums text-foreground'
        }
      >
        {formatTry(amountTry, true)}
      </span>
      <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{formatUsd(amountUsd)}</p>
    </>
  );
}

export default function AdminCostsPage() {
  const monthOptions = useMemo(buildMonthOptions, []);

  const [month, setMonth] = useState<string>(monthOptions[0].value);
  const [data, setData] = useState<CostAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // What-if hesaplayıcı — fiyat TRY, planlar ₺799 / ₺1.999 / ₺5.999 bandında.
  const [whatIfAllowance, setWhatIfAllowance] = useState('1500000');
  const [whatIfPrice, setWhatIfPrice] = useState('1999');
  const [whatIfTier, setWhatIfTier] = useState<ModelTier>('pro');
  const [projection, setProjection] = useState<PlanProjection | null>(null);
  const [projecting, setProjecting] = useState(false);
  const [projectionError, setProjectionError] = useState<string | null>(null);

  const loadAnalysis = useCallback(async (selectedMonth: string, isInitial: boolean) => {
    try {
      if (isInitial) setLoading(true);
      else setRefreshing(true);
      setError(null);
      const result = await getCostAnalysis(selectedMonth);
      setData(result);
    } catch (err) {
      console.error('Error loading cost analysis:', err);
      setError(err instanceof Error ? err.message : 'Maliyet analizi yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalysis(month, data === null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, loadAnalysis]);

  // Debounced projeksiyon — yazarken her tuşta istek atmamak için.
  useEffect(() => {
    const allowance = Number(whatIfAllowance);
    const price = Number(whatIfPrice);

    if (!Number.isFinite(allowance) || allowance <= 0 || !Number.isFinite(price) || price < 0) {
      setProjection(null);
      setProjectionError(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setProjecting(true);
        setProjectionError(null);
        const result = await projectPlanEconomics({
          tokenAllowance: allowance,
          // Backend alan adı `monthlyPrice`; değer TRY olarak yorumlanır.
          monthlyPrice: price,
          tier: whatIfTier,
        });
        if (!cancelled) setProjection(result);
      } catch (err) {
        if (!cancelled) {
          setProjectionError(
            err instanceof Error ? err.message : 'Projeksiyon hesaplanamadı',
          );
        }
      } finally {
        if (!cancelled) setProjecting(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [whatIfAllowance, whatIfPrice, whatIfTier]);

  const actuals = data?.actuals;
  const exchangeRate = data?.exchangeRate ?? actuals?.exchangeRate ?? 0;
  // Memoised so the `?? []` fallbacks do not produce a fresh array identity on
  // every render, which would re-run the hooks below (and the what-if call).
  const tiers = useMemo(() => data?.tiers ?? [], [data?.tiers]);
  const plans = data?.plans ?? [];
  const tokenPacks = useMemo(() => data?.tokenPacks ?? [], [data?.tokenPacks]);
  const models = useMemo(
    () => [...(data?.models ?? [])].sort((a, b) => b.totalCostUsd - a.totalCostUsd),
    [data?.models],
  );

  const tierLabel = useCallback(
    (tier: string | null | undefined) => {
      if (!tier) return null;
      return tiers.find((t) => t.tier === tier)?.label ?? tier;
    },
    [tiers],
  );

  /**
   * Maliyet seviyeyle birlikte artmak zorunda değil: Premium (gpt-4.1) daha yeni
   * bir model olduğu için Pro'dan (gpt-4o) ucuza gelir. Tabloyu okuyan birinin
   * bunu hata sanmaması için, sıralamada bir düşüş varsa açıkça yazıyoruz.
   */
  const costInversion = useMemo(() => {
    for (let i = 1; i < tiers.length; i += 1) {
      const prev = tiers[i - 1];
      const current = tiers[i];
      if (current.blendedCostPerMillionUsd < prev.blendedCostPerMillionUsd) {
        return { cheaper: current, pricier: prev };
      }
    }
    return null;
  }, [tiers]);

  /** Paket marj tablosunun sütunları: önce bilinen seviyeler, sonra veride görülenler. */
  const packTierKeys = useMemo(() => {
    const keys = new Set<string>();
    tiers.forEach((t) => keys.add(t.tier));
    tokenPacks.forEach((p) => Object.keys(p.marginByTier ?? {}).forEach((k) => keys.add(k)));
    return Array.from(keys);
  }, [tiers, tokenPacks]);

  const projectionMarginTone = marginTone(projection?.grossMarginPct);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Maliyet Analizi"
        description="Sağlayıcı maliyeti USD (bize dolarla fatura edilir), gelir ve fiyatlar TRY. İkisi aşağıdaki kur üzerinden karşılaştırılır."
        actions={
          <div className="flex items-center gap-2">
            <label htmlFor="month-select" className="sr-only">
              Ay seçin
            </label>
            <select
              id="month-select"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className={`${SELECT_CLASS} w-44`}
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => loadAnalysis(month, false)}
              disabled={refreshing}
              aria-label="Yenile"
              title="Yenile"
            >
              <RefreshCw className={refreshing ? 'animate-spin' : undefined} />
            </Button>
          </div>
        }
      />

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive-muted p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-destructive">Analiz yüklenemedi</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {data && (
        <div
          className={`space-y-10 transition-opacity duration-base ease-out-quart ${
            refreshing ? 'pointer-events-none opacity-60' : 'opacity-100'
          }`}
        >
          {/* ── 0. Kur ───────────────────────────────────────────────────────
           * Sayfadaki her marj bu tek sayıya bağlı: kur bayatsa hepsi yanlış.
           * Bu yüzden en üstte ve büyük gösteriliyor. */}
          <section>
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <ArrowLeftRight className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    Dönüşüm kuru (USD → TRY)
                  </p>
                  <p className="mt-1 text-2xl font-semibold leading-none tracking-tight tabular-nums text-foreground-strong">
                    1 $ = {formatTry(exchangeRate, true)}
                  </p>
                </div>
              </div>
              <p className="max-w-md text-xs leading-relaxed text-muted-foreground sm:text-right">
                Bu sayfadaki <span className="font-medium text-foreground">tüm</span> maliyet–gelir
                karşılaştırmaları ve marjlar bu kurla hesaplandı.{' '}
                <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[11px]">
                  USD_TRY_RATE
                </code>{' '}
                ortam değişkeninden okunur; değer bayatsa buradaki her marj yanlıştır.
              </p>
            </div>
          </section>

          {/* ── 1. Bu ayın gerçekleşen tablosu ───────────────────────────── */}
          <section>
            <SectionHeading
              eyebrow="Gerçekleşen"
              title={`${monthOptions.find((m) => m.value === month)?.label ?? month} özeti`}
              description="Sağlayıcı faturası ile tahsil edilen gelir arasındaki fark. Gelir; abonelik ve token paketi satışlarının toplamıdır. Maliyet kartlarında büyük rakam TRY karşılığı, altındaki ise faturalanan USD tutarıdır."
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Sağlayıcı maliyeti"
                value={formatTry(actuals?.providerCostTry)}
                icon={<Server />}
                hint={`${formatUsd(actuals?.providerCostUsd)} fatura · ${formatTokens(
                  actuals?.totalTokens,
                )} token (${formatTokens(actuals?.tokensIn)} girdi · ${formatTokens(
                  actuals?.tokensOut,
                )} çıktı)`}
              />
              <StatCard
                label="Gelir"
                value={formatTry(actuals?.revenueTry)}
                icon={<Wallet />}
                hint={`Abonelik ${formatTry(actuals?.subscriptionRevenueTry)} · Ek paket ${formatTry(
                  actuals?.topUpRevenueTry,
                )}`}
              />
              <StatCard
                label="Brüt kâr"
                value={formatTry(actuals?.grossProfitTry)}
                icon={<PiggyBank />}
                hint={`${count(actuals?.activeSubscriptions)} aktif abonelik · gelir − maliyet (TRY)`}
              />
              <StatCard
                label="Brüt marj"
                value={formatPercent(actuals?.grossMarginPct)}
                icon={<Percent />}
                hint="Hedef: %70 ve üzeri"
              />
              <StatCard
                label="Üretilen blog"
                value={count(actuals?.articlesGenerated)}
                icon={<FileText />}
                hint={`${count(actuals?.generationRequests)} üretim isteği`}
              />
              <StatCard
                label="Blog başına ort. maliyet"
                value={formatTry(actuals?.avgCostPerArticleTry, true)}
                icon={<Calculator />}
                hint={`${formatUsd(
                  actuals?.avgCostPerArticleUsd,
                )} · sağlayıcı maliyeti ÷ üretilen blog`}
              />
            </div>
          </section>

          {/* ── 2. Kalite seviyesi ekonomisi ─────────────────────────────── */}
          <section>
            <SectionHeading
              eyebrow="Birim ekonomi"
              title="Kalite seviyesi ekonomisi"
              description="Sağlayıcı fiyatları USD/1M token olarak yayımlanır, bu yüzden bu tabloda olduğu gibi bırakıldı. Düşünme (reasoning) token'ları çıktı olarak faturalandığı için harmanlanmış maliyet, çıktı fiyatını düşünme katsayısıyla ağırlıklandırır."
            />
            {tiers.length === 0 ? (
              <EmptyState
                icon={<Layers />}
                title="Kalite seviyesi tanımlı değil"
                description="Sağlayıcı fiyatlandırması yüklendiğinde bu tablo dolacak."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seviye</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Girdi $/1M</TableHead>
                    <TableHead className="text-right">Çıktı $/1M</TableHead>
                    <TableHead className="text-right">Düşünme kat.</TableHead>
                    <TableHead className="text-right">Harmanlanmış $/1M</TableHead>
                    <TableHead className="text-right">Blog başına token</TableHead>
                    <TableHead className="text-right">Blog başına maliyet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiers.map((tier) => (
                    <TableRow key={tier.tier}>
                      <TableCell>
                        <Badge variant={TIER_BADGE[tier.tier] ?? 'outline'}>{tier.label}</Badge>
                        <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                          {tier.description}
                        </p>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {tier.model}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatUsd(tier.inputPricePerMillionUsd)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatUsd(tier.outputPricePerMillionUsd)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {tier.reasoningFactor.toFixed(2)}×
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums text-foreground-strong">
                        {formatUsd(tier.blendedCostPerMillionUsd)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatTokens(tier.avgTokensPerArticle)}
                      </TableCell>
                      <TableCell className="text-right">
                        <CostCell
                          amountTry={tier.avgCostPerArticleTry}
                          amountUsd={tier.avgCostPerArticleUsd}
                          emphasis
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {costInversion && (
              <div className="mt-3 flex items-start gap-3 rounded-xl border border-border bg-secondary p-4">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Maliyet seviyeyle artmıyor —</span>{' '}
                  bu bir hata değil.{' '}
                  <span className="font-medium text-foreground">{costInversion.cheaper.label}</span>{' '}
                  (
                  <span className="font-mono">{costInversion.cheaper.model}</span>) token başına{' '}
                  <span className="font-medium text-foreground">{costInversion.pricier.label}</span>{' '}
                  (<span className="font-mono">{costInversion.pricier.model}</span>) seviyesinden
                  ucuza gelir; daha yeni bir model olduğu için sağlayıcı listesinde daha düşük
                  fiyatlanmış. Üst seviye, daha pahalı olduğu için değil daha iyi çıktı verdiği için
                  üst seviyedir — dolayısıyla marjı da daha yüksek çıkar.
                </p>
              </div>
            )}
          </section>

          {/* ── 3. Plan kârlılığı ────────────────────────────────────────── */}
          <section>
            <SectionHeading
              eyebrow="Planlar"
              title="Plan kârlılığı"
              description="Her plan, token hakkının tamamı varsayılan kalite seviyesinde harcanmış gibi değerlendirilir — yani en kötü senaryo. Fiyatlar TRY, maliyet sütununda üstteki rakam TRY karşılığı, altındaki faturalanan USD."
            />
            {plans.length === 0 ? (
              <EmptyState
                icon={<Layers />}
                title="Plan bulunamadı"
                description="Planlar tanımlandığında kârlılık tablosu burada görünür."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Aylık fiyat</TableHead>
                    <TableHead className="text-right">Token hakkı</TableHead>
                    <TableHead className="text-right">≈ Blog</TableHead>
                    <TableHead className="text-right">Tam kullanımda maliyet</TableHead>
                    <TableHead className="text-right">Brüt marj</TableHead>
                    <TableHead className="text-right">Başabaş blog</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => {
                    const tone = marginTone(plan.grossMarginPct);
                    return (
                      <TableRow key={plan.planId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground-strong">{plan.name}</span>
                            <Badge variant={TIER_BADGE[plan.defaultTier] ?? 'outline'}>
                              {tierLabel(plan.defaultTier)}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {plan.level}
                            {plan.yearlyPriceTry > 0 && ` · yıllık ${formatTry(plan.yearlyPriceTry)}`}
                          </p>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums text-foreground-strong">
                          {formatTry(plan.monthlyPriceTry)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {plan.tokenAllowance === null ? (
                            <span className="text-muted-foreground">Sınırsız</span>
                          ) : (
                            formatTokens(plan.tokenAllowance)
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {count(plan.estimatedArticles)}
                        </TableCell>
                        <TableCell className="text-right">
                          <CostCell
                            amountTry={plan.costAtFullUsageTry}
                            amountUsd={plan.costAtFullUsageUsd}
                          />
                        </TableCell>
                        <TableCell className={`text-right font-semibold tabular-nums ${tone}`}>
                          {formatPercent(plan.grossMarginPct)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {count(plan.breakEvenArticles)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Marj eşikleri: <span className="font-medium text-success">%70+ sağlıklı</span> ·{' '}
              <span className="font-medium text-warning">%50–70 izlenmeli</span> ·{' '}
              <span className="font-medium text-destructive">%50 altı riskli</span>.
            </p>
          </section>

          {/* ── 4. What-if hesaplayıcı ───────────────────────────────────── */}
          <section>
            <SectionHeading
              eyebrow="Senaryo"
              title="Plan senaryosu hesaplayıcı"
              description="Yeni bir plan kurgulamadan önce token hakkı ile fiyatı deneyin. Değerler yazarken otomatik hesaplanır."
            />
            <Card>
              <CardHeader>
                <CardTitle>Girdiler</CardTitle>
                <CardDescription>
                  Tüm token hakkı seçilen kalite seviyesinde tüketilirse ne olur?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className={LABEL_CLASS} htmlFor="whatif-allowance">
                      Aylık token hakkı
                    </label>
                    <Input
                      id="whatif-allowance"
                      type="number"
                      min={0}
                      step={50000}
                      value={whatIfAllowance}
                      onChange={(e) => setWhatIfAllowance(e.target.value)}
                      placeholder="1500000"
                    />
                    <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
                      {Number(whatIfAllowance) > 0
                        ? `${count(Number(whatIfAllowance))} token`
                        : 'Pozitif bir değer girin'}
                    </p>
                  </div>
                  <div>
                    <label className={LABEL_CLASS} htmlFor="whatif-price">
                      Aylık fiyat (TRY)
                    </label>
                    <Input
                      id="whatif-price"
                      type="number"
                      min={0}
                      step={50}
                      value={whatIfPrice}
                      onChange={(e) => setWhatIfPrice(e.target.value)}
                      placeholder="1999"
                    />
                    <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
                      {Number(whatIfPrice) >= 0 && whatIfPrice !== ''
                        ? `${formatTry(Number(whatIfPrice))} / ay`
                        : 'Geçerli bir fiyat girin'}
                    </p>
                  </div>
                  <div>
                    <label className={LABEL_CLASS} htmlFor="whatif-tier">
                      Kalite seviyesi
                    </label>
                    <select
                      id="whatif-tier"
                      value={whatIfTier}
                      onChange={(e) => setWhatIfTier(e.target.value as ModelTier)}
                      className={SELECT_CLASS}
                    >
                      {(tiers.length > 0
                        ? tiers.map((t) => ({ value: t.tier, label: t.label }))
                        : [
                            { value: 'standard' as ModelTier, label: 'Standart' },
                            { value: 'pro' as ModelTier, label: 'Pro' },
                            { value: 'premium' as ModelTier, label: 'Premium' },
                          ]
                      ).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1.5 font-mono text-xs text-muted-foreground">
                      {tiers.find((t) => t.tier === whatIfTier)?.model ?? 'Model seçilecek'}
                    </p>
                  </div>
                </div>

                {projectionError && (
                  <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive-muted p-4">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <p className="text-sm text-destructive">{projectionError}</p>
                  </div>
                )}

                {projection ? (
                  <div
                    className={`rounded-xl bg-surface-raised p-5 transition-opacity duration-base ease-out-quart ${
                      projecting ? 'opacity-60' : 'opacity-100'
                    }`}
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground-strong">
                        {tierLabel(projection.tier)} seviyesinde sonuç
                      </p>
                      <span className="font-mono text-xs text-muted-foreground">
                        {projection.model} · 1 $ = {formatTry(projection.exchangeRate, true)}
                      </span>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-3">
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">
                          Tahmini blog sayısı
                        </dt>
                        <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground-strong">
                          {count(projection.estimatedArticles)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">
                          Tam kullanımda maliyet
                        </dt>
                        <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground-strong">
                          {formatTry(projection.costAtFullUsageTry)}
                        </dd>
                        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                          {formatUsd(projection.costAtFullUsageUsd)} sağlayıcı faturası
                        </p>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">Brüt kâr</dt>
                        <dd
                          className={`mt-1 text-xl font-semibold tabular-nums ${
                            projection.grossProfitTry < 0
                              ? 'text-destructive'
                              : 'text-foreground-strong'
                          }`}
                        >
                          {formatTry(projection.grossProfitTry)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">Brüt marj</dt>
                        <dd
                          className={`mt-1 text-xl font-semibold tabular-nums ${projectionMarginTone}`}
                        >
                          {formatPercent(projection.grossMarginPct)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">
                          Blog başına maliyet
                        </dt>
                        <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground-strong">
                          {formatTry(projection.costPerArticleTry, true)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">
                          %70 marj için asgari fiyat
                        </dt>
                        <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground-strong">
                          {formatTry(projection.minPriceFor70PctMarginTry)}
                        </dd>
                        {projection.monthlyPriceTry < projection.minPriceFor70PctMarginTry && (
                          <p className="mt-1 text-xs text-warning">
                            Mevcut fiyat{' '}
                            {formatTry(
                              projection.minPriceFor70PctMarginTry - projection.monthlyPriceTry,
                            )}{' '}
                            düşük.
                          </p>
                        )}
                      </div>
                    </dl>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl bg-surface-raised p-5 text-sm text-muted-foreground">
                    {projecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Hesaplanıyor…
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4" />
                        Sonuç için token hakkı ve fiyat girin.
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* ── 5. Token paketi marjları ─────────────────────────────────── */}
          <section>
            <SectionHeading
              eyebrow="Ek satın alma"
              title="Token paketi marjları"
              description="Satın alınan tokenlar süresiz geçerlidir ve yalnızca aylık hak tükendikten sonra harcanır. Paket fiyatı TRY; marj, tokenların hangi kalite seviyesinde tüketildiğine göre değişir."
            />
            {tokenPacks.length === 0 ? (
              <EmptyState
                icon={<Coins />}
                title="Token paketi tanımlı değil"
                description="Paketler eklendiğinde marj tablosu burada görünür."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paket</TableHead>
                    <TableHead className="text-right">Token</TableHead>
                    <TableHead className="text-right">Fiyat</TableHead>
                    <TableHead className="text-right">Satış ₺/1M</TableHead>
                    {packTierKeys.map((key) => (
                      <TableHead key={key} className="text-right">
                        {tierLabel(key)} marjı
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokenPacks.map((pack) => (
                    <TableRow key={pack.key}>
                      <TableCell className="font-medium text-foreground-strong">
                        {pack.name}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatTokens(pack.tokens)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums text-foreground-strong">
                        {formatTry(pack.priceTry)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatTry(pack.pricePerMillionTry)}
                      </TableCell>
                      {packTierKeys.map((key) => {
                        const entry = pack.marginByTier?.[key];
                        const tone = marginTone(entry?.grossMarginPct);
                        return (
                          <TableCell key={key} className="text-right">
                            {entry ? (
                              <>
                                <span className={`font-semibold tabular-nums ${tone}`}>
                                  {formatPercent(entry.grossMarginPct)}
                                </span>
                                <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                                  maliyet {formatTry(entry.costTry)}{' '}
                                  <span className="whitespace-nowrap">
                                    ({formatUsd(entry.costUsd)})
                                  </span>
                                </p>
                              </>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          {/* ── 6. Model bazında gerçekleşen maliyet ─────────────────────── */}
          <section>
            <SectionHeading
              eyebrow="Gerçekleşen"
              title="Model bazında maliyet"
              description="Seçili ayda fiilen faturalanan token kullanımı. Maliyeti en yüksek modelden başlar; birim fiyatlar sağlayıcının yayımladığı gibi USD/1M token."
            />
            {models.length === 0 ? (
              <EmptyState
                icon={<Cpu />}
                title="Bu ay model kullanımı yok"
                description="Seçili ayda kaydedilmiş bir üretim bulunmuyor. Başka bir ay seçmeyi deneyin."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Seviye</TableHead>
                    <TableHead className="text-right">Üretim</TableHead>
                    <TableHead className="text-right">Girdi token</TableHead>
                    <TableHead className="text-right">Çıktı token</TableHead>
                    <TableHead className="text-right">Girdi $/1M</TableHead>
                    <TableHead className="text-right">Çıktı $/1M</TableHead>
                    <TableHead className="text-right">Toplam maliyet</TableHead>
                    <TableHead className="text-right">Üretim başına</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((model) => (
                    <TableRow key={model.model}>
                      <TableCell className="font-mono text-xs text-foreground-strong">
                        {model.model}
                      </TableCell>
                      <TableCell>
                        {model.tier ? (
                          <Badge variant={TIER_BADGE[model.tier] ?? 'outline'}>
                            {tierLabel(model.tier)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Eşlenmemiş</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {count(model.revisions)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatTokens(model.tokensIn)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatTokens(model.tokensOut)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatUsd(model.inputPricePerMillionUsd)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatUsd(model.outputPricePerMillionUsd)}
                      </TableCell>
                      <TableCell className="text-right">
                        <CostCell
                          amountTry={model.totalCostTry}
                          amountUsd={model.totalCostUsd}
                          emphasis
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {/* API bu alanı yalnızca USD döndürüyor; TRY karşılığı
                            sayfanın kuruyla türetiliyor. */}
                        <CostCell
                          amountTry={usdToTry(model.avgCostPerRevisionUsd, exchangeRate)}
                          amountUsd={model.avgCostPerRevisionUsd}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-raised p-4">
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Plan ve paket marjları, token hakkının tamamının kullanıldığı varsayımıyla
              hesaplanır; gerçek kullanım genelde bunun altında kaldığı için gerçekleşen marj
              daha yüksek olur. Karşılaştırma yaparken üstteki gerçekleşen tabloyu esas alın.
              Maliyet tarafı USD olduğundan kur hareketi, fiyatlara dokunmadan da marjı değiştirir.
            </p>
          </div>
        </div>
      )}

      {!data && !loading && !error && (
        <EmptyState
          icon={<Coins />}
          title="Veri bulunamadı"
          description="Seçili ay için maliyet analizi oluşturulamadı."
          action={
            <Button variant="outline" onClick={() => loadAnalysis(month, false)}>
              <RefreshCw />
              Tekrar dene
            </Button>
          }
        />
      )}
    </div>
  );
}
