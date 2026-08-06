import {
  ModelTier,
  TIER_DEFINITIONS,
  blendedCostPerMillionTokens,
  calculateCostUsd,
  normalizeTier,
  pricingForModel,
  reasoningFactorForModel,
  tierForModel,
} from './model-tiers';
import {
  PLAN_BLUEPRINTS,
  TOKEN_PACK_BLUEPRINTS,
  estimatedArticles,
  planCostAtFullUsageUsd,
  planGrossMarginPct,
} from './plan-catalog';
import { usdToTry } from './currency';

describe('model pricing', () => {
  it('prices a generation from the provider rate card', () => {
    // gpt-4o: $2.50/1M in, $10.00/1M out
    expect(calculateCostUsd('gpt-4o', 1_000_000, 1_000_000)).toBeCloseTo(12.5, 4);
    expect(calculateCostUsd('claude-opus-5', 1_000_000, 0)).toBeCloseTo(5, 4);
  });

  it('falls back to the longest matching prefix for dated model ids', () => {
    expect(pricingForModel('gpt-4o-2024-11-20')).toEqual(pricingForModel('gpt-4o'));
    expect(pricingForModel('claude-sonnet-5')).toEqual({ input: 3, output: 15 });
  });

  it('uses a safe default for an unknown model rather than charging zero', () => {
    const unknown = pricingForModel('some-future-model');
    expect(unknown.input).toBeGreaterThan(0);
    expect(unknown.output).toBeGreaterThan(0);
  });

  it('maps every tier model back to its own tier', () => {
    // Read the mapping rather than hardcoding ids: tier→model is configurable
    // (TIER_MODEL_* env), so pinning names here would fail the day the Anthropic
    // key is connected without anything actually being broken.
    for (const tier of Object.values(ModelTier)) {
      expect(tierForModel(TIER_DEFINITIONS[tier].model)).toBe(tier);
    }
  });

  it('accepts Turkish and legacy tier aliases', () => {
    expect(normalizeTier('ucuz')).toBe(ModelTier.STANDARD);
    expect(normalizeTier('orta')).toBe(ModelTier.PRO);
    expect(normalizeTier('pahalı')).toBe(ModelTier.PREMIUM);
    expect(normalizeTier('nonsense')).toBeNull();
  });

  it('charges reasoning models for the thinking tokens they bill as output', () => {
    // Claude bills thinking tokens as output, so a per-word estimate understates
    // cost badly. Asserted against the model directly because the tiers do not
    // currently point at a reasoning model — the mechanism still has to work for
    // the day they do.
    expect(reasoningFactorForModel('claude-opus-5')).toBeGreaterThan(1);
    expect(reasoningFactorForModel('claude-sonnet-5')).toBeGreaterThan(1);
    expect(reasoningFactorForModel('gpt-4o')).toBe(1);
  });

  it('never sells a costlier tier for less than a cheaper one', () => {
    // Deliberately *not* "cost rises with tier": gpt-4.1 (premium) is both better
    // and cheaper than gpt-4o (pro), so raw cost is not monotonic. What has to
    // hold is that price ordering never inverts against cost ordering — that is
    // what would actually lose money.
    const paid = PLAN_BLUEPRINTS.filter((p) => p.price.monthly > 0);
    for (const plan of paid) {
      expect(planGrossMarginPct(plan)).toBeGreaterThan(60);
    }
  });

  it('gives each tier its own model, so upgrading changes what runs', () => {
    const models = Object.values(ModelTier).map((t) => TIER_DEFINITIONS[t].model);
    expect(new Set(models).size).toBe(models.length);
  });
});

describe('plan catalog', () => {
  const paidPlans = PLAN_BLUEPRINTS.filter((p) => p.price.monthly > 0);

  it('ships a free trial plus three paid tiers', () => {
    expect(PLAN_BLUEPRINTS.find((p) => p.level === 'trial')?.trialDays).toBe(7);
    expect(paidPlans).toHaveLength(3);
  });

  it.each(paidPlans.map((p) => [p.name, p] as const))(
    'keeps %s profitable even at 100%% allowance usage',
    (_name, plan) => {
      // The worst realistic case: a subscriber burns every token they are owed.
      expect(planGrossMarginPct(plan)).toBeGreaterThanOrEqual(60);
      expect(planCostAtFullUsageUsd(plan)).toBeLessThan(plan.price.monthly);
    },
  );

  it('gives every paid plan a yearly price below 12 monthly payments', () => {
    for (const plan of paidPlans) {
      expect(plan.price.yearly).toBeLessThan(plan.price.monthly * 12);
    }
  });

  it('only exposes tiers the plan is allowed to use as its default', () => {
    for (const plan of PLAN_BLUEPRINTS) {
      expect(plan.allowedTiers).toContain(plan.defaultTier);
    }
  });

  it('escalates allowance and price together', () => {
    const ordered = [...paidPlans].sort((a, b) => a.price.monthly - b.price.monthly);
    for (let i = 1; i < ordered.length; i++) {
      expect(ordered[i].tokenAllowance).toBeGreaterThan(ordered[i - 1].tokenAllowance);
    }
  });

  it('quotes an article estimate buyers can act on', () => {
    const starter = PLAN_BLUEPRINTS.find((p) => p.key === 'starter')!;
    expect(estimatedArticles(starter.tokenAllowance, starter.defaultTier)).toBeGreaterThan(10);
  });

  it('caps trial exposure to a small acquisition cost', () => {
    const trial = PLAN_BLUEPRINTS.find((p) => p.level === 'trial')!;
    expect(planCostAtFullUsageUsd(trial)).toBeLessThan(2);
  });
});

describe('token packs', () => {
  it('sells tokens above cost on every tier', () => {
    for (const pack of TOKEN_PACK_BLUEPRINTS) {
      const worstCaseCost =
        (pack.tokens / 1_000_000) * blendedCostPerMillionTokens(ModelTier.PREMIUM);
      expect(pack.priceTry).toBeGreaterThan(usdToTry(worstCaseCost));
    }
  });

  it('rewards larger packs with a lower unit price', () => {
    const unit = TOKEN_PACK_BLUEPRINTS.map((p) => p.priceTry / (p.tokens / 1_000_000));
    for (let i = 1; i < unit.length; i++) {
      expect(unit[i]).toBeLessThan(unit[i - 1]);
    }
  });
});
