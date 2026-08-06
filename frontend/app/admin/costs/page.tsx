'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calculator,
  Coins,
  Cpu,
  DollarSign,
  FileText,
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

const SELECT_CLASS =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground transition-colors hover:border-strong focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20';

const LABEL_CLASS = 'mb-1.5 block text-xs font-medium text-muted-foreground';

/* ── formatters ───────────────────────────────────────────────────────────
 * Currency is fixed at 2 decimals. The one exception: a non-zero amount below
 * a cent would render as "$0.00" and hide the figure entirely, so it falls
 * back to 4 decimals — an ops console must not round a real cost away.
 */
function usd(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const abs = Math.abs(value);
  const digits = abs > 0 && abs < 0.01 ? 4 : 2;
  return `$${value.toFixed(digits)}`;
}

function num(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString('tr-TR');
}

function pct(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `%${value.toFixed(1)}`;
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

export default function AdminCostsPage() {
  const monthOptions = useMemo(buildMonthOptions, []);

  const [month, setMonth] = useState<string>(monthOptions[0].value);
  const [data, setData] = useState<CostAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // What-if hesaplayıcı
  const [whatIfAllowance, setWhatIfAllowance] = useState('1500000');
  const [whatIfPrice, setWhatIfPrice] = useState('49');
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
        description="Sağlayıcı maliyeti, plan kârlılığı ve fiyatlandırma senaryoları. Tüm tutarlar USD."
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
          {/* ── 1. Bu ayın gerçekleşen tablosu ───────────────────────────── */}
          <section>
            <SectionHeading
              eyebrow="Gerçekleşen"
              title={`${monthOptions.find((m) => m.value === month)?.label ?? month} özeti`}
              description="Sağlayıcı faturası ile tahsil edilen gelir arasındaki fark. Gelir; abonelik ve token paketi satışlarının toplamıdır."
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Sağlayıcı maliyeti"
                value={usd(actuals?.providerCostUsd)}
                icon={<Server />}
                hint={`${num(actuals?.totalTokens)} token (${num(actuals?.tokensIn)} girdi · ${num(
                  actuals?.tokensOut,
                )} çıktı)`}
              />
              <StatCard
                label="Gelir"
                value={usd(actuals?.revenueUsd)}
                icon={<Wallet />}
                hint={`Abonelik ${usd(actuals?.subscriptionRevenueUsd)} · Ek paket ${usd(
                  actuals?.topUpRevenueUsd,
                )}`}
              />
              <StatCard
                label="Brüt kâr"
                value={usd(actuals?.grossProfitUsd)}
                icon={<PiggyBank />}
                hint={`${num(actuals?.activeSubscriptions)} aktif abonelik`}
              />
              <StatCard
                label="Brüt marj"
                value={pct(actuals?.grossMarginPct)}
                icon={<Percent />}
                hint="Hedef: %70 ve üzeri"
              />
              <StatCard
                label="Üretilen blog"
                value={num(actuals?.articlesGenerated)}
                icon={<FileText />}
                hint={`${num(actuals?.generationRequests)} üretim isteği`}
              />
              <StatCard
                label="Blog başına ort. maliyet"
                value={usd(actuals?.avgCostPerArticleUsd)}
                icon={<Calculator />}
                hint="Sağlayıcı maliyeti ÷ üretilen blog"
              />
            </div>
          </section>

          {/* ── 2. Kalite seviyesi ekonomisi ─────────────────────────────── */}
          <section>
            <SectionHeading
              eyebrow="Birim ekonomi"
              title="Kalite seviyesi ekonomisi"
              description="Düşünme (reasoning) token'ları sağlayıcı tarafından çıktı olarak faturalandığı için harmanlanmış maliyet, çıktı fiyatını düşünme katsayısıyla ağırlıklandırarak hesaplanır."
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
                        {usd(tier.inputPricePerMillion)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {usd(tier.outputPricePerMillion)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {tier.reasoningFactor.toFixed(2)}×
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums text-foreground-strong">
                        {usd(tier.blendedCostPerMillion)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {num(tier.avgTokensPerArticle)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums text-foreground-strong">
                        {usd(tier.avgCostPerArticle)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          {/* ── 3. Plan kârlılığı ────────────────────────────────────────── */}
          <section>
            <SectionHeading
              eyebrow="Planlar"
              title="Plan kârlılığı"
              description="Her plan, token hakkının tamamı varsayılan kalite seviyesinde harcanmış gibi değerlendirilir — yani en kötü senaryo. Başabaş blog sayısı, aylık fiyatı karşılayan üretim adedidir."
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
                            {plan.yearlyPrice > 0 && ` · yıllık ${usd(plan.yearlyPrice)}`}
                          </p>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums text-foreground-strong">
                          {usd(plan.monthlyPrice)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {num(plan.tokenAllowance)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {num(plan.estimatedArticles)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {usd(plan.costAtFullUsage)}
                        </TableCell>
                        <TableCell className={`text-right font-semibold tabular-nums ${tone}`}>
                          {pct(plan.grossMarginPct)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {num(plan.breakEvenArticles)}
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
                        ? `${num(Number(whatIfAllowance))} token`
                        : 'Pozitif bir değer girin'}
                    </p>
                  </div>
                  <div>
                    <label className={LABEL_CLASS} htmlFor="whatif-price">
                      Aylık fiyat (USD)
                    </label>
                    <Input
                      id="whatif-price"
                      type="number"
                      min={0}
                      step={1}
                      value={whatIfPrice}
                      onChange={(e) => setWhatIfPrice(e.target.value)}
                      placeholder="49"
                    />
                    <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
                      {Number(whatIfPrice) >= 0 && whatIfPrice !== ''
                        ? `${usd(Number(whatIfPrice))} / ay`
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
                    <p className="mt-1.5 text-xs text-muted-foreground">
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
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground-strong">
                        {tierLabel(projection.tier)} seviyesinde sonuç
                      </p>
                      <span className="font-mono text-xs text-muted-foreground">
                        {projection.model}
                      </span>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-3">
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">
                          Tahmini blog sayısı
                        </dt>
                        <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground-strong">
                          {num(projection.estimatedArticles)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">
                          Tam kullanımda maliyet
                        </dt>
                        <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground-strong">
                          {usd(projection.costAtFullUsageUsd)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">Brüt kâr</dt>
                        <dd
                          className={`mt-1 text-xl font-semibold tabular-nums ${
                            projection.grossProfitUsd < 0
                              ? 'text-destructive'
                              : 'text-foreground-strong'
                          }`}
                        >
                          {usd(projection.grossProfitUsd)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">Brüt marj</dt>
                        <dd
                          className={`mt-1 text-xl font-semibold tabular-nums ${projectionMarginTone}`}
                        >
                          {pct(projection.grossMarginPct)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">
                          Blog başına maliyet
                        </dt>
                        <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground-strong">
                          {usd(projection.costPerArticleUsd)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">
                          %70 marj için asgari fiyat
                        </dt>
                        <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground-strong">
                          {usd(projection.minPriceFor70PctMargin)}
                        </dd>
                        {projection.monthlyPrice < projection.minPriceFor70PctMargin && (
                          <p className="mt-1 text-xs text-warning">
                            Mevcut fiyat {usd(projection.minPriceFor70PctMargin - projection.monthlyPrice)}{' '}
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
              description="Satın alınan tokenlar süresiz geçerlidir ve yalnızca aylık hak tükendikten sonra harcanır. Marj, tokenların hangi kalite seviyesinde tüketildiğine göre değişir."
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
                    <TableHead className="text-right">Satış $/1M</TableHead>
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
                      <TableCell className="text-right tabular-nums">{num(pack.tokens)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums text-foreground-strong">
                        {usd(pack.priceUsd)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {usd(pack.pricePerMillionUsd)}
                      </TableCell>
                      {packTierKeys.map((key) => {
                        const entry = pack.marginByTier?.[key];
                        const tone = marginTone(entry?.grossMarginPct);
                        return (
                          <TableCell key={key} className="text-right">
                            {entry ? (
                              <>
                                <span className={`font-semibold tabular-nums ${tone}`}>
                                  {pct(entry.grossMarginPct)}
                                </span>
                                <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                                  maliyet {usd(entry.costUsd)}
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
              description="Seçili ayda fiilen faturalanan token kullanımı. Maliyeti en yüksek modelden başlar."
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
                        {num(model.revisions)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {num(model.tokensIn)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {num(model.tokensOut)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {usd(model.inputPricePerMillion)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {usd(model.outputPricePerMillion)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-foreground-strong">
                        {usd(model.totalCostUsd)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {usd(model.avgCostPerRevisionUsd)}
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
            </p>
          </div>
        </div>
      )}

      {!data && !loading && !error && (
        <EmptyState
          icon={<DollarSign />}
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
