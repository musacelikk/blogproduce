import type { ModelTier, PlanDefinition, TierInfo, TokenPack } from '@/lib/api';

/**
 * The single view model behind every pricing surface: the public /pricing page,
 * the homepage section and the in-app plan picker. Anything that turns raw
 * plan/pack data into customer-facing copy lives here, so the three surfaces
 * cannot drift apart.
 */

export type BillingPeriod = 'monthly' | 'yearly';

export const TIER_ORDER: ModelTier[] = ['standard', 'pro', 'premium'];

export const TIER_LABELS: Record<ModelTier, string> = {
  standard: 'Standart',
  pro: 'Pro',
  premium: 'Premium',
};

/** Served by /billing/tiers; kept here so the page still renders if it is unreachable. */
export const FALLBACK_TIERS: TierInfo[] = [
  {
    tier: 'standard',
    label: 'Standart',
    description: 'Hızlı ve ekonomik. Yüksek hacimli içerik üretimi için.',
  },
  {
    tier: 'pro',
    label: 'Pro',
    description: 'Dengeli seçim. Uzun form içerikte belirgin kalite artışı.',
  },
  {
    tier: 'premium',
    label: 'Premium',
    description: 'En yüksek kalite. Pillar içerik ve kurumsal yayınlar için.',
  },
];

/** What each tier means for the buyer — speed against depth, never a model id. */
export const TIER_PITCH: Record<ModelTier, { speed: string; depth: string; bestFor: string }> = {
  standard: {
    speed: 'En hızlı üretim',
    depth: 'Net ve derli toplu metin',
    bestFor: 'Ürün açıklamaları, haber ve kategori yazıları',
  },
  pro: {
    speed: 'Dengeli süre',
    depth: 'Daha güçlü kurgu ve akış',
    bestFor: 'Düzenli SEO blogları ve rehber içerikler',
  },
  premium: {
    speed: 'Daha uzun süre',
    depth: 'En derin araştırma ve nüans',
    bestFor: 'Pillar içerik, kurumsal yayınlar, uzun raporlar',
  },
};

/**
 * Billable tokens one average article consumes on each tier — mirrors the
 * backend cost model (10K girdi + 9K çıktı, tier'ın düşünme katsayısıyla).
 * Only used for the "≈ N blog" figure next to the raw token count.
 */
const AVG_ARTICLE_TOKENS: Record<ModelTier, number> = {
  standard: 19_000,
  pro: 22_150,
  premium: 26_200,
};

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  level: PlanDefinition['level'];
  popular: boolean;
  isTrial: boolean;
  trialDays: number | null;
  monthlyPrice: number;
  yearlyPrice: number;
  /** Yearly price expressed per month — what the card shows in yearly mode. */
  yearlyPerMonth: number;
  /** Whole dollars saved over a year by paying yearly. */
  yearlySavingUsd: number;
  yearlySavingPct: number;
  /** Monthly token allowance; null means unlimited. */
  tokenAllowance: number | null;
  /** Articles that allowance buys on the plan's default tier; null when unlimited. */
  estimatedArticles: number | null;
  allowedTiers: ModelTier[];
  defaultTier: ModelTier;
  maxWorkspaces: number | 'unlimited';
  highlights: string[];
  raw: PlanDefinition;
}

function normalizeTier(value: unknown): ModelTier | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  return (TIER_ORDER as string[]).includes(v) ? (v as ModelTier) : null;
}

function languageLabel(languages: string[] | undefined): string {
  const count = languages?.length ?? 0;
  if (count > 10) return 'Çok dilli içerik (50+ dil)';
  if (count > 0) return `${count.toLocaleString('tr-TR')} dilde içerik üretimi`;
  return 'Türkçe ve İngilizce içerik üretimi';
}

function supportLabel(features: PlanDefinition['features']): string {
  if (features.accountManager) return 'Özel hesap yöneticisi';
  if (features.prioritySupport) return 'Öncelikli destek';
  return `${features.support || 'E-posta'} desteği`;
}

/** The bullet list under a plan card — capacity numbers are shown separately. */
export function planHighlights(features: PlanDefinition['features']): string[] {
  const out: string[] = [];
  if (features.apiAccess) out.push('RESTful API erişimi');
  if (features.webhookAccess) out.push('Webhook entegrasyonları');
  out.push(features.advancedSeo ? 'Gelişmiş SEO optimizasyonu' : 'Temel SEO optimizasyonu');
  if (features.analytics) out.push('Analitik paneli');
  if (features.customBranding) out.push('Özel marka uyumu');
  if (features.customTraining) out.push('Özel AI model eğitimi');
  out.push(languageLabel(features.languages));
  out.push(supportLabel(features));
  return out;
}

export function toPricingPlan(plan: PlanDefinition): PricingPlan {
  const features = plan.features ?? ({} as PlanDefinition['features']);
  const monthlyPrice = Number(plan.price?.monthly) || 0;
  const yearlyPrice = Number(plan.price?.yearly) || 0;
  const fullYear = monthlyPrice * 12;

  const allowedTiers = (Array.isArray(features.allowedTiers) ? features.allowedTiers : [])
    .map(normalizeTier)
    .filter((t): t is ModelTier => t !== null);
  const defaultTier = normalizeTier(features.defaultTier) ?? allowedTiers[0] ?? 'standard';

  const allowance =
    typeof features.maxTokensPerMonth === 'number' ? features.maxTokensPerMonth : null;

  return {
    id: String(plan.id),
    name: plan.name || 'Plan',
    description: plan.description || '',
    level: plan.level,
    popular: Boolean(plan.popular),
    isTrial: plan.level === 'trial' || (monthlyPrice === 0 && Boolean(plan.trialDays)),
    trialDays: plan.trialDays ?? null,
    monthlyPrice,
    yearlyPrice,
    yearlyPerMonth: yearlyPrice > 0 ? yearlyPrice / 12 : 0,
    yearlySavingUsd: fullYear > yearlyPrice ? fullYear - yearlyPrice : 0,
    yearlySavingPct:
      fullYear > 0 && yearlyPrice > 0 ? Math.max(0, Math.round(100 - (yearlyPrice / fullYear) * 100)) : 0,
    tokenAllowance: allowance,
    estimatedArticles:
      allowance !== null ? Math.floor(allowance / AVG_ARTICLE_TOKENS[defaultTier]) : null,
    allowedTiers: allowedTiers.length ? TIER_ORDER.filter((t) => allowedTiers.includes(t)) : ['standard'],
    defaultTier,
    maxWorkspaces:
      features.maxWorkspaces === 'unlimited' || features.maxWorkspaces == null
        ? 'unlimited'
        : Number(features.maxWorkspaces),
    highlights: planHighlights(features),
    raw: plan,
  };
}

/** Cheapest first — the order every pricing surface reads in. */
export function toPricingPlans(plans: PlanDefinition[]): PricingPlan[] {
  return [...(plans ?? [])]
    .map(toPricingPlan)
    .sort((a, b) => a.monthlyPrice - b.monthlyPrice);
}

/**
 * The real yearly saving across the paid plans. `uniform` is false when the
 * plans discount differently, in which case the toggle says "…'ye varan".
 */
export function yearlySaving(plans: PricingPlan[]): { pct: number; uniform: boolean } | null {
  const discounts = plans
    .filter((p) => p.monthlyPrice > 0 && p.yearlyPrice > 0)
    .map((p) => p.yearlySavingPct)
    .filter((pct) => pct > 0);
  if (discounts.length === 0) return null;
  const pct = Math.max(...discounts);
  return { pct, uniform: discounts.every((d) => d === pct) };
}

// ── Formatting ───────────────────────────────────────────────────────────

/** USD, e.g. $49 — cents only when the amount actually has them. */
export function formatUsd(value: number, forceDecimals = false): string {
  const decimals = forceDecimals || !Number.isInteger(value);
  return `$${value.toLocaleString('tr-TR', {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  })}`;
}

export function formatTokens(value: number): string {
  return value.toLocaleString('tr-TR');
}

/** 1.500.000 → "1,5M", 250.000 → "250K" */
export function compactTokens(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}K`;
  }
  return formatTokens(value);
}

export function formatWorkspaces(value: number | 'unlimited'): string {
  return value === 'unlimited' ? 'Sınırsız' : value.toLocaleString('tr-TR');
}

// ── Token packs ──────────────────────────────────────────────────────────

export interface PricingPack {
  id: string;
  name: string;
  tokens: number;
  priceUsd: number;
  popular: boolean;
  /** USD per 1M tokens — the number that makes the volume discount visible. */
  pricePerMillion: number;
  /** Discount against the smallest pack's unit price; 0 for the baseline pack. */
  savingPct: number;
  estimatedArticles: number;
}

export function toPricingPacks(packs: TokenPack[]): PricingPack[] {
  const sorted = [...(packs ?? [])].filter((p) => p.tokens > 0).sort((a, b) => a.tokens - b.tokens);
  const baseline = sorted.length ? sorted[0].priceUsd / (sorted[0].tokens / 1_000_000) : 0;

  return sorted.map((pack) => {
    const pricePerMillion = pack.priceUsd / (pack.tokens / 1_000_000);
    return {
      id: pack.id,
      name: pack.name,
      tokens: pack.tokens,
      priceUsd: pack.priceUsd,
      popular: Boolean(pack.popular),
      pricePerMillion,
      savingPct:
        baseline > 0 ? Math.max(0, Math.round(100 - (pricePerMillion / baseline) * 100)) : 0,
      estimatedArticles: Math.floor(pack.tokens / AVG_ARTICLE_TOKENS.standard),
    };
  });
}

// ── Feature comparison ───────────────────────────────────────────────────

export interface ComparisonRow {
  name: string;
  value: (plan: PricingPlan) => boolean | string;
}

export interface ComparisonGroup {
  category: string;
  rows: ComparisonRow[];
}

export const COMPARISON_GROUPS: ComparisonGroup[] = [
  {
    category: 'Kapasite',
    rows: [
      {
        name: 'Aylık token hakkı',
        value: (p) => (p.tokenAllowance === null ? 'Sınırsız' : formatTokens(p.tokenAllowance)),
      },
      {
        name: 'Tahmini blog / ay',
        value: (p) =>
          p.estimatedArticles === null
            ? 'Sınırsız'
            : `≈ ${p.estimatedArticles.toLocaleString('tr-TR')}`,
      },
      { name: 'Workspace', value: (p) => formatWorkspaces(p.maxWorkspaces) },
      {
        name: 'Kalite kademeleri',
        value: (p) => p.allowedTiers.map((t) => TIER_LABELS[t]).join(' · '),
      },
      {
        name: 'Dil desteği',
        value: (p) => languageLabel(p.raw.features?.languages),
      },
    ],
  },
  {
    category: 'Teknik',
    rows: [
      { name: 'RESTful API erişimi', value: (p) => Boolean(p.raw.features?.apiAccess) },
      { name: 'Webhook entegrasyonları', value: (p) => Boolean(p.raw.features?.webhookAccess) },
      { name: 'Gelişmiş SEO optimizasyonu', value: (p) => Boolean(p.raw.features?.advancedSeo) },
      { name: 'Analitik paneli', value: (p) => Boolean(p.raw.features?.analytics) },
      { name: 'Özel marka uyumu', value: (p) => Boolean(p.raw.features?.customBranding) },
    ],
  },
  {
    category: 'Destek',
    rows: [
      { name: 'Destek kanalı', value: (p) => p.raw.features?.support || 'E-posta' },
      { name: 'Öncelikli destek', value: (p) => Boolean(p.raw.features?.prioritySupport) },
      { name: 'Özel hesap yöneticisi', value: (p) => Boolean(p.raw.features?.accountManager) },
      { name: 'Özel AI model eğitimi', value: (p) => Boolean(p.raw.features?.customTraining) },
    ],
  },
];

// ── FAQ ──────────────────────────────────────────────────────────────────

export interface PricingFaqItem {
  question: string;
  answer: string;
}

export const PRICING_FAQ: PricingFaqItem[] = [
  {
    question: 'Token nedir, nasıl harcanır?',
    answer:
      'Token, yapay zekânın okuduğu ve yazdığı metnin ölçü birimidir. Bir blog yazısı; başlık planı, taslak ve editör geçişi dahil ortalama 20 bin token harcar. Yani 1,5 milyon tokenlık bir plan ayda yaklaşık 65 yazıya denk gelir. Harcama her üretimde gerçek kullanım üzerinden ölçülür, panelden anlık olarak görebilirsiniz.',
  },
  {
    question: 'Aylık limitim biterse ne olur?',
    answer:
      'Üretim durur, hesabınız kapanmaz. Dilerseniz ay sonunu bekleyip yenilenen hakkınızı kullanır, dilerseniz ek token paketi alırsınız. Satın alınan tokenlar aylık hak bittikten sonra devreye girer, böylece önce paketinizdeki hak harcanır.',
  },
  {
    question: 'Planımı sonradan değiştirebilir miyim?',
    answer:
      'Evet. İstediğiniz an yükseltebilir veya düşürebilirsiniz. Yükseltmede yeni token hakkı hemen tanımlanır; düşürmede mevcut dönem sonuna kadar planınız aynı kalır ve sonraki dönem yeni plandan devam eder. Taahhüt yoktur, iptal tek tıkladır.',
  },
  {
    question: 'İade alabilir miyim?',
    answer:
      'Abonelik ücretlerinde ilk 14 gün içinde koşulsuz iade yapıyoruz; talebiniz aynı ödeme yöntemine iade edilir. Kullanılmamış ek token paketleri de satın alma tarihinden itibaren 14 gün içinde iade edilebilir. 7 günlük deneme sürümünde kredi kartı istemediğimiz için iade süreci de gerekmez.',
  },
];
