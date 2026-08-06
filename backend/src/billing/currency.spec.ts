import {
  DEFAULT_USD_TRY_RATE,
  formatTry,
  grossMarginPct,
  tryToUsd,
  usdToTry,
  usdTryRate,
} from './currency';
import { PLAN_BLUEPRINTS, TOKEN_PACK_BLUEPRINTS, planCostAtFullUsageUsd } from './plan-catalog';
import { ModelTier, blendedCostPerMillionTokens } from './model-tiers';
import { generateReferenceCode } from './bank-transfer';

describe('currency boundary', () => {
  const originalRate = process.env.USD_TRY_RATE;
  afterEach(() => {
    if (originalRate === undefined) delete process.env.USD_TRY_RATE;
    else process.env.USD_TRY_RATE = originalRate;
  });

  it('reads the rate from the environment so a redeploy can correct it', () => {
    process.env.USD_TRY_RATE = '50';
    expect(usdTryRate()).toBe(50);
  });

  it('ignores a nonsense rate rather than pricing everything at zero', () => {
    process.env.USD_TRY_RATE = 'not-a-number';
    expect(usdTryRate()).toBe(DEFAULT_USD_TRY_RATE);

    process.env.USD_TRY_RATE = '0';
    expect(usdTryRate()).toBe(DEFAULT_USD_TRY_RATE);

    process.env.USD_TRY_RATE = '-10';
    expect(usdTryRate()).toBe(DEFAULT_USD_TRY_RATE);
  });

  it('round-trips a conversion', () => {
    process.env.USD_TRY_RATE = '42';
    expect(tryToUsd(usdToTry(13.5))).toBeCloseTo(13.5, 6);
  });

  /**
   * The bug this guards against: revenue is TRY and cost is USD, so subtracting
   * them directly reports a margin ~40x better than reality. A ₺100 sale against
   * a $50 cost is a *loss*, not a 50% margin.
   */
  it('converts cost before comparing it to lira revenue', () => {
    process.env.USD_TRY_RATE = '40';
    expect(grossMarginPct(100, 50)).toBeLessThan(0);
    expect(grossMarginPct(100, 1)).toBeCloseTo(60, 5);
  });

  it('reports no margin for an unpriced item instead of dividing by zero', () => {
    expect(grossMarginPct(0, 5)).toBeNull();
  });

  it('formats lira for a Turkish reader', () => {
    const formatted = formatTry(1999);
    expect(formatted).toContain('₺');
    expect(formatted).toContain('1.999');
  });
});

describe('plan economics survive a weaker lira', () => {
  const originalRate = process.env.USD_TRY_RATE;
  afterEach(() => {
    if (originalRate === undefined) delete process.env.USD_TRY_RATE;
    else process.env.USD_TRY_RATE = originalRate;
  });

  /**
   * Prices are fixed in lira but costs are incurred in dollars, so currency
   * depreciation eats the margin directly. This is the scenario that quietly
   * turns a profitable plan into a loss-maker, so it is asserted rather than
   * assumed: at a rate 50% worse than today's, every paid plan must still clear
   * a real margin.
   */
  it('keeps every paid plan profitable at a 50% worse exchange rate', () => {
    process.env.USD_TRY_RATE = String(DEFAULT_USD_TRY_RATE * 1.5);

    for (const plan of PLAN_BLUEPRINTS.filter((p) => p.price.monthly > 0)) {
      const margin = grossMarginPct(plan.price.monthly, planCostAtFullUsageUsd(plan));
      expect(margin).not.toBeNull();
      expect(margin!).toBeGreaterThan(50);
    }
  });

  it('keeps token packs above cost at a 50% worse exchange rate, on every tier', () => {
    process.env.USD_TRY_RATE = String(DEFAULT_USD_TRY_RATE * 1.5);

    for (const pack of TOKEN_PACK_BLUEPRINTS) {
      for (const tier of Object.values(ModelTier)) {
        const costUsd = (pack.tokens / 1_000_000) * blendedCostPerMillionTokens(tier);
        expect(pack.priceTry).toBeGreaterThan(usdToTry(costUsd));
      }
    }
  });
});

describe('bank transfer reference codes', () => {
  /**
   * The customer retypes this into a banking app by hand. A single misread
   * character produces a payment nobody can match to an account, so the alphabet
   * excludes every look-alike pair (0/O, 1/I/L, 2/Z, 5/S, 8/B).
   */
  it('avoids characters that are misread when retyped', () => {
    const forbidden = /[0O1IL2Z5S8B]/;
    for (let i = 0; i < 200; i++) {
      expect(generateReferenceCode().slice(3)).not.toMatch(forbidden);
    }
  });

  it('is prefixed and short enough to dictate over the phone', () => {
    const code = generateReferenceCode();
    expect(code).toMatch(/^BP-[A-Z0-9]{6}$/);
  });

  it('does not repeat itself in a realistic batch', () => {
    const codes = new Set(Array.from({ length: 500 }, () => generateReferenceCode()));
    expect(codes.size).toBe(500);
  });
});
