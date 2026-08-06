import type { ModelTier, PlanDefinition, TierInfo, TokenPack } from '@/lib/api';
import { formatTokens } from '@/lib/currency';

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
  /** Lira saved over a year by paying yearly. */
  yearlySavingTry: number;
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

/**
 * One decimal, which is also what `formatPercent` renders. Rounding here rather
 * than at display time keeps the "same discount on every plan" check from
 * failing on floating-point noise between two plans that discount identically.
 */
function roundPct(value: number): number {
  return Math.max(0, Math.round(value * 10) / 10);
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
    yearlySavingTry: fullYear > yearlyPrice ? fullYear - yearlyPrice : 0,
    yearlySavingPct:
      fullYear > 0 && yearlyPrice > 0 ? roundPct(100 - (yearlyPrice / fullYear) * 100) : 0,
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

/**
 * Money and token formatting live in `@/lib/currency` — every surface in the app
 * shares them so a price can never be rendered in the wrong currency. Re-exported
 * here because the pricing components already import their view model from this
 * file.
 */
export { formatTokens, formatTry, formatPercent } from '@/lib/currency';

/** Article counts, not tokens — a plain locale number, never abbreviated. */
export function formatCount(value: number): string {
  return value.toLocaleString('tr-TR');
}

export function formatWorkspaces(value: number | 'unlimited'): string {
  return value === 'unlimited' ? 'Sınırsız' : value.toLocaleString('tr-TR');
}

// ── Token packs ──────────────────────────────────────────────────────────

export interface PricingPack {
  id: string;
  name: string;
  tokens: number;
  priceTry: number;
  popular: boolean;
  /** TRY per 1M tokens — the number that makes the volume discount visible. */
  pricePerMillion: number;
  /** Discount against the smallest pack's unit price; 0 for the baseline pack. */
  savingPct: number;
  estimatedArticles: number;
}

export function toPricingPacks(packs: TokenPack[]): PricingPack[] {
  const sorted = [...(packs ?? [])].filter((p) => p.tokens > 0).sort((a, b) => a.tokens - b.tokens);
  const baseline = sorted.length ? sorted[0].priceTry / (sorted[0].tokens / 1_000_000) : 0;

  return sorted.map((pack) => {
    const pricePerMillion = pack.priceTry / (pack.tokens / 1_000_000);
    return {
      id: pack.id,
      name: pack.name,
      tokens: pack.tokens,
      priceTry: pack.priceTry,
      popular: Boolean(pack.popular),
      pricePerMillion,
      savingPct: baseline > 0 ? roundPct(100 - (pricePerMillion / baseline) * 100) : 0,
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
          p.estimatedArticles === null ? 'Sınırsız' : `≈ ${formatCount(p.estimatedArticles)}`,
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
    question: 'Ödeme nasıl yapılıyor?',
    answer:
      'Ödemeler havale/EFT ile alınır; kredi kartı kullanmıyoruz. Planı ya da token paketini seçtiğinizde panelde banka hesap bilgilerimiz ve size özel bir referans kodu görünür. Transferi yaparken açıklama alanına bu kodu yazmanız yeterli — ödemeyi eşleştirip mesai saatleri içinde manuel olarak onaylıyoruz. Onaydan sonra planınız veya token bakiyeniz hesabınıza tanımlanır ve panelde bildirim alırsınız.',
  },
  {
    question: 'Ödemem ne kadar sürede onaylanır?',
    answer:
      'Onay otomatik değil, elle yapılır: ödemeniz hesabımıza geçtikten sonra referans kodunuzla eşleştirilip tanımlanır. Mesai saatleri içinde gelen transferler genellikle aynı iş günü, mesai dışında veya hafta sonu yapılanlar ilk iş günü onaylanır. Bankalar arası transferlerde paranın hesabımıza geçme süresi bu takvimi etkileyebilir. Bu sırada ücretsiz denemenizi kullanmaya devam edebilirsiniz.',
  },
  {
    question: 'Token nedir, nasıl harcanır?',
    answer:
      'Token, yapay zekânın okuduğu ve yazdığı metnin ölçü birimidir. Bir blog yazısı; başlık planı, taslak ve editör geçişi dahil ortalama 20 bin token harcar. Yani 1,5 milyon tokenlık bir plan ayda yaklaşık 65 yazıya denk gelir. Harcama her üretimde gerçek kullanım üzerinden ölçülür, panelden anlık olarak görebilirsiniz.',
  },
  {
    question: 'Aylık token hakkım biterse ne olur?',
    answer:
      'Yeni üretim durur, hesabınız kapanmaz; mevcut içerikleriniz, taslaklarınız ve yayınlarınız olduğu gibi kalır. İki seçeneğiniz var: ay başını bekleyip yenilenen hakkınızla devam edebilir ya da ek token paketi alarak aynı gün üretime dönebilirsiniz. Paket ödemesi de havale/EFT ile alındığı için tokenlar onaydan sonra tanımlanır.',
  },
  {
    question: 'Kullanmadığım tokenlar bir sonraki aya devreder mi?',
    answer:
      'Planın aylık token hakkı devretmez; her ay başında sıfırlanıp yeniden tanımlanır. Satın aldığınız ek token paketlerinin ise son kullanma tarihi yoktur, silinmez. Sistem önce o ayki plan hakkınızı harcar, ancak o bittikten sonra paket bakiyenize dokunur — böylece yoğun olmayan bir ayda satın aldığınız tokenlar boşa gitmez, ihtiyacınız olan ayı bekler.',
  },
  {
    question: 'Planımı sonradan değiştirebilir miyim?',
    answer:
      'Evet. Yükseltmek istediğinizde yeni planın ücretini havale/EFT ile gönderirsiniz, ödeme onaylandığında yeni token hakkınız tanımlanır. Düşürmede veya bırakmada mevcut dönem sonuna kadar planınız aynı kalır, sonraki dönem için yeni bir ödeme yapmamanız yeterlidir. Otomatik yenileme yoktur, dolayısıyla habersiz bir tahsilat da olmaz.',
  },
  {
    question: '7 günlük deneme için kart bilgisi gerekiyor mu?',
    answer:
      'Hayır. Kayıt olduğunuz anda 7 günlük deneme planı otomatik tanımlanır; kredi kartı ya da herhangi bir ödeme bilgisi istemiyoruz. Deneme süresi bittiğinde üretim durur, hesabınız kendiliğinden ücretli bir plana geçmez. Devam etmek isterseniz bir plan seçip havale/EFT ile ödeme yaparsınız.',
  },
  {
    question: 'İade alabilir miyim?',
    answer:
      'Abonelik ücretlerinde ilk 14 gün içinde iade yapıyoruz; tutar, ödemeyi gönderdiğiniz banka hesabına havale ile geri aktarılır. Kullanılmamış ek token paketleri de satın alma tarihinden itibaren 14 gün içinde iade edilebilir. Deneme sürümünde ödeme almadığımız için iade süreci de gerekmez.',
  },
];
