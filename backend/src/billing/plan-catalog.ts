import {
  ModelTier,
  averageArticleTokens,
  blendedCostPerMillionTokens,
} from './model-tiers';
import { grossMarginPct } from './currency';

/**
 * The commercial catalog: subscription plans, the free trial, and the
 * pay-as-you-go token packs. **Prices are TRY** — provider cost is USD and only
 * ever meets these numbers through `currency.ts`.
 *
 * Plans are seeded into `plan_definitions` and editable from the admin panel —
 * this file is the source of truth for a fresh install and the reference the
 * admin cost calculator scores margins against.
 */

export interface PlanBlueprint {
  key: string;
  name: string;
  level: 'trial' | 'starter' | 'pro' | 'enterprise';
  description: string;
  /** TRY. Yearly is priced at ten months, so an annual commitment saves two. */
  price: { monthly: number; yearly: number };
  /** Monthly token allowance. Resets each calendar month. */
  tokenAllowance: number;
  /** Which model tiers this plan may generate with. */
  allowedTiers: ModelTier[];
  /** The tier used when the caller does not name one. */
  defaultTier: ModelTier;
  maxWorkspaces: number | 'unlimited';
  popular: boolean;
  /** Only set for the trial plan. */
  trialDays?: number;
  features: {
    apiAccess: boolean;
    webhookAccess: boolean;
    advancedSeo: boolean;
    analytics: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
    accountManager: boolean;
    customTraining: boolean;
    support: string;
    languages: string[];
  };
}

const ALL_LANGUAGES = ['tr', 'en', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'ru', 'ar'];

export const TRIAL_DAYS = 7;

export const PLAN_BLUEPRINTS: PlanBlueprint[] = [
  {
    key: 'trial',
    name: 'Ücretsiz Deneme',
    level: 'trial',
    description:
      '7 gün boyunca ücretsiz deneyin. Kredi kartı gerekmez, dilediğiniz an yükseltin.',
    price: { monthly: 0, yearly: 0 },
    tokenAllowance: 150_000,
    allowedTiers: [ModelTier.STANDARD, ModelTier.PRO],
    defaultTier: ModelTier.STANDARD,
    maxWorkspaces: 1,
    popular: false,
    trialDays: TRIAL_DAYS,
    features: {
      apiAccess: true,
      webhookAccess: false,
      advancedSeo: true,
      analytics: false,
      customBranding: false,
      prioritySupport: false,
      accountManager: false,
      customTraining: false,
      support: 'E-posta',
      languages: ALL_LANGUAGES,
    },
  },
  {
    key: 'starter',
    name: 'Başlangıç',
    level: 'starter',
    description:
      'Blogunu düzenli beslemek isteyen bireyler ve küçük ekipler için.',
    price: { monthly: 799, yearly: 7_990 },
    tokenAllowance: 500_000,
    allowedTiers: [ModelTier.STANDARD],
    defaultTier: ModelTier.STANDARD,
    maxWorkspaces: 2,
    popular: false,
    features: {
      apiAccess: true,
      webhookAccess: false,
      advancedSeo: true,
      analytics: true,
      customBranding: false,
      prioritySupport: false,
      accountManager: false,
      customTraining: false,
      support: 'E-posta',
      languages: ALL_LANGUAGES,
    },
  },
  {
    key: 'pro',
    name: 'Profesyonel',
    level: 'pro',
    description:
      'Ajanslar ve içerik ekipleri için. Pro kalite seviyesiyle belirgin fark.',
    price: { monthly: 1_999, yearly: 19_990 },
    tokenAllowance: 1_500_000,
    allowedTiers: [ModelTier.STANDARD, ModelTier.PRO],
    defaultTier: ModelTier.PRO,
    maxWorkspaces: 10,
    popular: true,
    features: {
      apiAccess: true,
      webhookAccess: true,
      advancedSeo: true,
      analytics: true,
      customBranding: true,
      prioritySupport: true,
      accountManager: false,
      customTraining: false,
      support: 'Öncelikli e-posta',
      languages: ALL_LANGUAGES,
    },
  },
  {
    key: 'enterprise',
    name: 'Kurumsal',
    level: 'enterprise',
    description:
      'Yüksek hacim ve pillar içerik. En üst kalite seviyesi ve özel destek.',
    price: { monthly: 5_999, yearly: 59_990 },
    tokenAllowance: 3_000_000,
    allowedTiers: [ModelTier.STANDARD, ModelTier.PRO, ModelTier.PREMIUM],
    defaultTier: ModelTier.PREMIUM,
    maxWorkspaces: 'unlimited',
    popular: false,
    features: {
      apiAccess: true,
      webhookAccess: true,
      advancedSeo: true,
      analytics: true,
      customBranding: true,
      prioritySupport: true,
      accountManager: true,
      customTraining: true,
      support: 'Özel hesap yöneticisi',
      languages: ALL_LANGUAGES,
    },
  },
];

/** Pay-as-you-go top-ups. Bought once, never expire, spent after the monthly allowance. */
export interface TokenPackBlueprint {
  key: string;
  name: string;
  tokens: number;
  /** TRY. */
  priceTry: number;
  popular: boolean;
}

export const TOKEN_PACK_BLUEPRINTS: TokenPackBlueprint[] = [
  { key: 'topup-250k', name: '250K Token', tokens: 250_000, priceTry: 499, popular: false },
  { key: 'topup-1m', name: '1M Token', tokens: 1_000_000, priceTry: 1_599, popular: true },
  { key: 'topup-5m', name: '5M Token', tokens: 5_000_000, priceTry: 6_999, popular: false },
];

/**
 * Roughly how many articles an allowance buys on a given tier — the figure
 * shown on pricing next to the raw token number, which means little to buyers.
 */
export function estimatedArticles(tokenAllowance: number, tier: ModelTier): number {
  return Math.floor(tokenAllowance / averageArticleTokens(tier));
}

/** Provider cost (USD) if a plan's entire allowance is spent on its default tier. */
export function planCostAtFullUsageUsd(plan: PlanBlueprint): number {
  return (plan.tokenAllowance / 1_000_000) * blendedCostPerMillionTokens(plan.defaultTier);
}

/**
 * Gross margin (%) at full allowance usage — the worst realistic case.
 * Revenue is TRY, cost is USD, so the comparison goes through the exchange rate.
 */
export function planGrossMarginPct(plan: PlanBlueprint): number {
  return grossMarginPct(plan.price.monthly, planCostAtFullUsageUsd(plan)) ?? 0;
}
