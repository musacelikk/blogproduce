/**
 * Model tiers, real provider pricing, and the cost model the whole billing
 * surface is derived from (quota enforcement, plan margins, the admin cost
 * calculator).
 *
 * Provider prices are **USD per 1M tokens**, as published by the providers —
 * that is what we are actually billed. Customer-facing prices are TRY and live
 * in `plan-catalog.ts`; `currency.ts` is the only place the two meet.
 */

export enum ModelTier {
  /** High volume, lowest cost. */
  STANDARD = 'standard',
  /** Default for SEO content — noticeably better long-form quality. */
  PRO = 'pro',
  /** Pillar content: deepest reasoning, best structure and nuance. */
  PREMIUM = 'premium',
}

export interface ModelPricing {
  /** USD per 1M input tokens. */
  input: number;
  /** USD per 1M output tokens. */
  output: number;
}

export interface TierDefinition {
  tier: ModelTier;
  model: string;
  label: string;
  description: string;
  pricing: ModelPricing;
  /**
   * Output-token multiplier for reasoning models: thinking tokens are billed as
   * output but never appear in the article, so a naive per-word estimate would
   * understate cost. 1 = no reasoning overhead.
   */
  reasoningFactor: number;
}

/** Every model we may be billed for, including ones only reachable as fallbacks. */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4.1': { input: 2.0, output: 8.0 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },

  // Anthropic
  'claude-opus-5': { input: 5.0, output: 25.0 },
  'claude-opus-4-8': { input: 5.0, output: 25.0 },
  'claude-sonnet-5': { input: 3.0, output: 15.0 },
  'claude-haiku-4-5': { input: 1.0, output: 5.0 },

  // Legacy ids kept so historical ledger rows still price correctly
  'gpt-4': { input: 2.0, output: 8.0 },
  'gpt-4-turbo': { input: 0.4, output: 1.6 },
  'gpt-3.5-turbo': { input: 0.15, output: 0.6 },
};

export const DEFAULT_MODEL_PRICING: ModelPricing = { input: 2.5, output: 10.0 };

/**
 * Models that spend tokens thinking before answering. Those tokens are billed as
 * output but never reach the article, so cost projections must inflate the
 * output estimate or they understate the tier badly.
 */
const REASONING_FACTORS: Record<string, number> = {
  'claude-opus-5': 1.8,
  'claude-opus-4-8': 1.8,
  'claude-sonnet-5': 1.35,
  'claude-haiku-4-5': 1.2,
};

/**
 * Which model each tier runs on today. **GPT-only** while the Anthropic key is
 * not yet connected — a tier pointing at Claude without a key would silently
 * degrade to another provider, so a customer paying for the top tier would get
 * standard quality with only a log line to show for it.
 *
 * Each is overridable by env, so connecting the Anthropic key later is a config
 * change and not a deploy:
 *
 *   TIER_MODEL_PRO=claude-sonnet-5
 *   TIER_MODEL_PREMIUM=claude-opus-5
 *
 * Pricing and the reasoning factor follow the model automatically (both are read
 * from the tables above), so an override can never leave billing out of step
 * with what actually ran.
 */
const DEFAULT_TIER_MODELS: Record<ModelTier, string> = {
  [ModelTier.STANDARD]: 'gpt-4o-mini',
  [ModelTier.PRO]: 'gpt-4o',
  [ModelTier.PREMIUM]: 'gpt-4.1',
};

const TIER_MODEL_ENV: Record<ModelTier, string> = {
  [ModelTier.STANDARD]: 'TIER_MODEL_STANDARD',
  [ModelTier.PRO]: 'TIER_MODEL_PRO',
  [ModelTier.PREMIUM]: 'TIER_MODEL_PREMIUM',
};

/**
 * Stand-in used when a model's provider has no API key configured. Keyed by the
 * *unavailable* provider, so the substitute always comes from the other one.
 *
 * This cannot be derived from the tier table: the tiers may all point at a
 * single provider (they currently do), in which case "use another tier" would
 * pick a model from the very provider that is down.
 */
export const SUBSTITUTE_MODEL: Record<'openai' | 'anthropic', string> = {
  anthropic: 'gpt-4o',
  openai: 'claude-sonnet-5',
};

export function modelForTier(tier: ModelTier): string {
  const override = process.env[TIER_MODEL_ENV[tier]]?.trim();
  return override || DEFAULT_TIER_MODELS[tier];
}

const TIER_COPY: Record<ModelTier, { label: string; description: string }> = {
  [ModelTier.STANDARD]: {
    label: 'Standart',
    description: 'Hızlı ve ekonomik. Yüksek hacimli içerik üretimi için.',
  },
  [ModelTier.PRO]: {
    label: 'Pro',
    description: 'Dengeli seçim. Uzun form içerikte belirgin kalite artışı.',
  },
  [ModelTier.PREMIUM]: {
    label: 'Premium',
    description: 'En yüksek kalite. Pillar içerik ve kurumsal yayınlar için.',
  },
};

function buildTierDefinition(tier: ModelTier): TierDefinition {
  const model = modelForTier(tier);
  return {
    tier,
    model,
    ...TIER_COPY[tier],
    pricing: pricingForModel(model),
    reasoningFactor: reasoningFactorForModel(model),
  };
}

/**
 * Built once at module load — env is fixed for the lifetime of a process, and a
 * plain object keeps every `TIER_DEFINITIONS[tier]` call site working.
 */
export const TIER_DEFINITIONS: Record<ModelTier, TierDefinition> = {
  [ModelTier.STANDARD]: buildTierDefinition(ModelTier.STANDARD),
  [ModelTier.PRO]: buildTierDefinition(ModelTier.PRO),
  [ModelTier.PREMIUM]: buildTierDefinition(ModelTier.PREMIUM),
};

/**
 * Typical token shape of one medium-length article through the three-stage
 * pipeline (outline → draft → editorial pass). Used for cost projections and
 * the "≈ N blog" figures shown on pricing; actual usage is metered per request.
 */
export const AVERAGE_ARTICLE_TOKENS = {
  input: 10_000,
  output: 9_000,
} as const;

/** Look up pricing by exact id, then by longest prefix (providers return dated ids). */
export function pricingForModel(model: string): ModelPricing {
  return lookupByPrefix(MODEL_PRICING, model) ?? DEFAULT_MODEL_PRICING;
}

export function reasoningFactorForModel(model: string): number {
  return lookupByPrefix(REASONING_FACTORS, model) ?? 1;
}

function lookupByPrefix<T>(table: Record<string, T>, model: string): T | undefined {
  const exact = table[model];
  if (exact !== undefined) return exact;

  const prefix = Object.keys(table)
    .filter((key) => model.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];

  return prefix ? table[prefix] : undefined;
}

export function calculateCostUsd(model: string, tokensIn: number, tokensOut: number): number {
  const pricing = pricingForModel(model);
  return (tokensIn / 1_000_000) * pricing.input + (tokensOut / 1_000_000) * pricing.output;
}

/** Projected provider cost of a single article on a given tier. */
export function averageArticleCostUsd(tier: ModelTier): number {
  const def = TIER_DEFINITIONS[tier];
  const outputTokens = AVERAGE_ARTICLE_TOKENS.output * def.reasoningFactor;
  return (
    (AVERAGE_ARTICLE_TOKENS.input / 1_000_000) * def.pricing.input +
    (outputTokens / 1_000_000) * def.pricing.output
  );
}

/** Billable tokens one article consumes on a tier (input + reasoning-adjusted output). */
export function averageArticleTokens(tier: ModelTier): number {
  const def = TIER_DEFINITIONS[tier];
  return Math.round(
    AVERAGE_ARTICLE_TOKENS.input + AVERAGE_ARTICLE_TOKENS.output * def.reasoningFactor,
  );
}

/**
 * Blended USD cost of 1M tokens on a tier, assuming the observed input/output
 * split. This is the number plan pricing is set against.
 */
export function blendedCostPerMillionTokens(tier: ModelTier): number {
  const def = TIER_DEFINITIONS[tier];
  const inputTokens = AVERAGE_ARTICLE_TOKENS.input;
  const outputTokens = AVERAGE_ARTICLE_TOKENS.output * def.reasoningFactor;
  const total = inputTokens + outputTokens;
  const cost =
    (inputTokens / 1_000_000) * def.pricing.input + (outputTokens / 1_000_000) * def.pricing.output;
  return (cost / total) * 1_000_000;
}

export function tierForModel(model: string): ModelTier | null {
  const match = Object.values(TIER_DEFINITIONS).find((def) => model.startsWith(def.model));
  return match ? match.tier : null;
}

/** Accepts tier names and their Turkish/legacy aliases. */
export function normalizeTier(value?: string): ModelTier | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (['standard', 'standart', 'ucuz', 'cheap', 'basic', 'starter'].includes(v)) {
    return ModelTier.STANDARD;
  }
  if (['pro', 'orta', 'medium', 'professional'].includes(v)) return ModelTier.PRO;
  if (['premium', 'pahali', 'pahalı', 'expensive', 'enterprise'].includes(v)) {
    return ModelTier.PREMIUM;
  }
  return null;
}
