import {
  ModelTier,
  averageArticleCostUsd,
  averageArticleTokens,
  blendedCostPerMillionTokens,
  calculateCostUsd,
  normalizeTier,
  pricingForModel,
  tierForModel,
} from './model-tiers';
import {
  PLAN_BLUEPRINTS,
  TOKEN_PACK_BLUEPRINTS,
  estimatedArticles,
  planCostAtFullUsageUsd,
  planGrossMarginPct,
} from './plan-catalog';

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

  it('maps tiers to the models the product sells', () => {
    expect(tierForModel('gpt-4o')).toBe(ModelTier.STANDARD);
    expect(tierForModel('claude-sonnet-5')).toBe(ModelTier.PRO);
    expect(tierForModel('claude-opus-5')).toBe(ModelTier.PREMIUM);
  });

  it('accepts Turkish and legacy tier aliases', () => {
    expect(normalizeTier('ucuz')).toBe(ModelTier.STANDARD);
    expect(normalizeTier('orta')).toBe(ModelTier.PRO);
    expect(normalizeTier('pahalı')).toBe(ModelTier.PREMIUM);
    expect(normalizeTier('nonsense')).toBeNull();
  });

  it('charges reasoning models more per article than their headline rate implies', () => {
    // Opus bills thinking tokens as output, so a per-word estimate understates cost.
    expect(averageArticleTokens(ModelTier.PREMIUM)).toBeGreaterThan(
      averageArticleTokens(ModelTier.STANDARD),
    );
    expect(averageArticleCostUsd(ModelTier.PREMIUM)).toBeGreaterThan(
      averageArticleCostUsd(ModelTier.PRO),
    );
  });

  it('orders tier economics cheapest-first', () => {
    const standard = blendedCostPerMillionTokens(ModelTier.STANDARD);
    const pro = blendedCostPerMillionTokens(ModelTier.PRO);
    const premium = blendedCostPerMillionTokens(ModelTier.PREMIUM);
    expect(standard).toBeLessThan(pro);
    expect(pro).toBeLessThan(premium);
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
      expect(pack.priceUsd).toBeGreaterThan(worstCaseCost);
    }
  });

  it('rewards larger packs with a lower unit price', () => {
    const unit = TOKEN_PACK_BLUEPRINTS.map((p) => p.priceUsd / (p.tokens / 1_000_000));
    for (let i = 1; i < unit.length; i++) {
      expect(unit[i]).toBeLessThan(unit[i - 1]);
    }
  });
});
