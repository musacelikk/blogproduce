import { ForbiddenException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { ModelTier } from './model-tiers';
import { PLAN_BLUEPRINTS } from './plan-catalog';

/**
 * Exercises the entitlement engine — the gate every generation passes through —
 * against stubbed repositories. No database, no network.
 */
function buildService(options: {
  user?: Partial<{ id: string; planId: string | null; trialEndsAt: Date | null; tokenBalance: number }>;
  plan?: any;
  subscription?: any;
  ledger?: { tokensIn: number; tokensOut: number } | null;
}) {
  const user = {
    id: 'user-1',
    planId: null,
    trialEndsAt: null,
    tokenBalance: 0,
    ...options.user,
  };

  const repo = (findOneResult: unknown) => ({
    findOne: async () => findOneResult,
    find: async () => [],
    update: async () => undefined,
    createQueryBuilder: () => ({
      update: () => ({ set: () => ({ where: () => ({ execute: async () => undefined }) }) }),
    }),
  });

  return new BillingService(
    repo(user) as any,
    repo(options.plan ?? null) as any,
    repo(options.subscription ?? null) as any,
    repo(options.ledger ?? null) as any,
    repo(null) as any,
    repo(null) as any,
    { transaction: async (fn: any) => fn({}) } as any,
  );
}

/** Shapes a PlanDefinition row the way the seeder writes it. */
function planRow(key: string) {
  const b = PLAN_BLUEPRINTS.find((p) => p.key === key)!;
  return {
    id: `plan-${key}`,
    name: b.name,
    level: b.level,
    price: b.price,
    features: {
      maxTokensPerMonth: b.tokenAllowance,
      maxWorkspaces: b.maxWorkspaces,
      allowedTiers: b.allowedTiers,
      defaultTier: b.defaultTier,
    },
  };
}

describe('entitlement resolution', () => {
  it('grants the trial allowance even before the catalog is seeded', async () => {
    // startTrial() can only attach a planId once a trial plan row exists; a fresh
    // install must not leave the first users with zero tokens.
    const future = new Date(Date.now() + 5 * 86_400_000);
    const service = buildService({ user: { trialEndsAt: future } });

    const entitlement = await service.getEntitlement('user-1');

    expect(entitlement.isTrial).toBe(true);
    expect(entitlement.tokenAllowance).toBeGreaterThan(0);
    expect(entitlement.trialDaysRemaining).toBe(5);
    expect(entitlement.isExpired).toBe(false);
  });

  it('reports an expired trial and stops granting allowance', async () => {
    const past = new Date(Date.now() - 86_400_000);
    const service = buildService({ user: { trialEndsAt: past } });

    const entitlement = await service.getEntitlement('user-1');

    expect(entitlement.isExpired).toBe(true);
    expect(entitlement.tokenAllowance).toBe(0);
    expect(entitlement.trialDaysRemaining).toBe(0);
  });

  it('subtracts this month usage from the allowance', async () => {
    const service = buildService({
      user: { planId: 'plan-starter' },
      plan: planRow('starter'),
      ledger: { tokensIn: 120_000, tokensOut: 80_000 },
    });

    const entitlement = await service.getEntitlement('user-1');

    expect(entitlement.tokensUsedThisMonth).toBe(200_000);
    expect(entitlement.tokensRemainingInPlan).toBe(300_000);
    expect(entitlement.totalTokensRemaining).toBe(300_000);
  });

  it('adds purchased tokens on top of the plan remainder', async () => {
    const service = buildService({
      user: { planId: 'plan-starter', tokenBalance: 250_000 },
      plan: planRow('starter'),
      ledger: { tokensIn: 500_000, tokensOut: 0 },
    });

    const entitlement = await service.getEntitlement('user-1');

    expect(entitlement.tokensRemainingInPlan).toBe(0);
    expect(entitlement.totalTokensRemaining).toBe(250_000);
    expect(entitlement.estimatedArticlesRemaining).toBeGreaterThan(0);
  });

  it('keeps top-up tokens usable after the plan lapses', async () => {
    const past = new Date(Date.now() - 86_400_000);
    const service = buildService({ user: { trialEndsAt: past, tokenBalance: 400_000 } });

    const entitlement = await service.getEntitlement('user-1');

    expect(entitlement.isExpired).toBe(true);
    expect(entitlement.tokenAllowance).toBe(0);
    expect(entitlement.totalTokensRemaining).toBe(400_000);
  });
});

describe('authorizeGeneration', () => {
  const future = new Date(Date.now() + 5 * 86_400_000);

  it('falls back to the plan default tier when none is requested', async () => {
    const service = buildService({ user: { planId: 'plan-pro' }, plan: planRow('pro') });
    await expect(service.authorizeGeneration('user-1')).resolves.toBe(ModelTier.PRO);
  });

  it('rejects a tier the plan does not include', async () => {
    // Başlangıç only unlocks the standard tier.
    const service = buildService({ user: { planId: 'plan-starter' }, plan: planRow('starter') });
    await expect(service.authorizeGeneration('user-1', 'premium')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('accepts Turkish tier aliases', async () => {
    const service = buildService({ user: { planId: 'plan-enterprise' }, plan: planRow('enterprise') });
    await expect(service.authorizeGeneration('user-1', 'pahalı')).resolves.toBe(ModelTier.PREMIUM);
  });

  it('blocks generation once the balance cannot cover one article', async () => {
    const service = buildService({
      user: { planId: 'plan-starter' },
      plan: planRow('starter'),
      ledger: { tokensIn: 499_000, tokensOut: 0 },
    });

    await expect(service.authorizeGeneration('user-1')).rejects.toThrow(/yetersiz/i);
  });

  it('blocks an expired trial with no purchased tokens', async () => {
    const past = new Date(Date.now() - 86_400_000);
    const service = buildService({ user: { trialEndsAt: past } });

    await expect(service.authorizeGeneration('user-1')).rejects.toThrow(/deneme süreniz/i);
  });

  it('lets a trialling user generate on an allowed tier', async () => {
    const service = buildService({ user: { trialEndsAt: future } });
    await expect(service.authorizeGeneration('user-1', 'standard')).resolves.toBe(
      ModelTier.STANDARD,
    );
  });
});
