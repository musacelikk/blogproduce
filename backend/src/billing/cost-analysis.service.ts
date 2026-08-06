import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanDefinition } from '../entities/plan-definition.entity';
import { UsageLedger } from '../entities/usage-ledger.entity';
import { PostRevision } from '../entities/post-revision.entity';
import { Subscription, SubscriptionStatus, BillingPeriod } from '../entities/subscription.entity';
import { TokenPurchase, TokenPurchaseStatus } from '../entities/token-purchase.entity';
import {
  ModelTier,
  TIER_DEFINITIONS,
  averageArticleCostUsd,
  averageArticleTokens,
  blendedCostPerMillionTokens,
  calculateCostUsd,
  pricingForModel,
  tierForModel,
} from './model-tiers';
import { PLAN_BLUEPRINTS, TOKEN_PACK_BLUEPRINTS } from './plan-catalog';
import { grossMarginPct, usdToTry, usdTryRate } from './currency';

/**
 * Powers the admin cost calculator: what a blog actually costs us, what each
 * plan earns at full usage, and how projected margins compare to reality.
 *
 * **Costs are USD, revenue is TRY.** Provider bills arrive in dollars while we
 * charge lira, so every margin here converts the cost side at `usdTryRate()`
 * before comparing. Field suffixes (`...Usd` / `...Try`) are load-bearing —
 * subtracting one from the other without converting silently reports a margin
 * that is ~40x too good.
 */
@Injectable()
export class CostAnalysisService {
  constructor(
    @InjectRepository(PlanDefinition) private plansRepository: Repository<PlanDefinition>,
    @InjectRepository(UsageLedger) private usageLedgerRepository: Repository<UsageLedger>,
    @InjectRepository(PostRevision) private revisionsRepository: Repository<PostRevision>,
    @InjectRepository(Subscription) private subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(TokenPurchase) private purchasesRepository: Repository<TokenPurchase>,
  ) {}

  /** Reference economics per tier — independent of actual traffic. */
  getTierEconomics() {
    return Object.values(TIER_DEFINITIONS).map((def) => ({
      tier: def.tier,
      model: def.model,
      label: def.label,
      description: def.description,
      inputPricePerMillionUsd: def.pricing.input,
      outputPricePerMillionUsd: def.pricing.output,
      reasoningFactor: def.reasoningFactor,
      blendedCostPerMillionUsd: Number(blendedCostPerMillionTokens(def.tier).toFixed(2)),
      avgTokensPerArticle: averageArticleTokens(def.tier),
      avgCostPerArticleUsd: Number(averageArticleCostUsd(def.tier).toFixed(4)),
      avgCostPerArticleTry: Number(usdToTry(averageArticleCostUsd(def.tier)).toFixed(2)),
    }));
  }

  /** Per-plan margin at 100% allowance usage — the worst realistic case. */
  async getPlanEconomics() {
    const plans = await this.plansRepository.find({ where: { active: true } });

    return plans.map((plan) => {
      const blueprint = PLAN_BLUEPRINTS.find(
        (b) => b.key === plan.key || b.level === (plan.level as any),
      );
      const rawAllowance = plan.features?.maxTokensPerMonth;
      const allowance =
        rawAllowance === 'unlimited'
          ? null
          : Number(rawAllowance ?? blueprint?.tokenAllowance ?? 0);

      const defaultTier =
        (plan.features?.defaultTier as ModelTier) ?? blueprint?.defaultTier ?? ModelTier.STANDARD;

      const monthlyPriceTry = Number(plan.price?.monthly ?? 0);
      const costAtFullUsageUsd =
        allowance === null ? null : (allowance / 1_000_000) * blendedCostPerMillionTokens(defaultTier);

      const costPerArticleTry = usdToTry(averageArticleCostUsd(defaultTier));

      return {
        planId: plan.id,
        key: plan.key,
        name: plan.name,
        level: plan.level,
        monthlyPriceTry,
        yearlyPriceTry: Number(plan.price?.yearly ?? 0),
        tokenAllowance: allowance,
        defaultTier,
        estimatedArticles:
          allowance === null ? null : Math.floor(allowance / averageArticleTokens(defaultTier)),
        costAtFullUsageUsd:
          costAtFullUsageUsd === null ? null : Number(costAtFullUsageUsd.toFixed(2)),
        costAtFullUsageTry:
          costAtFullUsageUsd === null ? null : Number(usdToTry(costAtFullUsageUsd).toFixed(2)),
        grossMarginPct:
          costAtFullUsageUsd === null ? null : grossMarginPct(monthlyPriceTry, costAtFullUsageUsd),
        /**
         * Articles a subscriber can generate before the plan stops being
         * profitable — clamped to the allowance, because the quota stops them
         * first. Unclamped this reports a loss scenario that cannot occur.
         */
        breakEvenArticles: this.breakEvenArticles(monthlyPriceTry, costPerArticleTry, allowance, defaultTier),
      };
    });
  }

  /** What actually happened in a month: real cost, real revenue, real margin. */
  async getActuals(month?: string) {
    const targetMonth = month || this.currentMonth();

    const ledgers = await this.usageLedgerRepository.find({ where: { month: targetMonth } });
    const providerCost = ledgers.reduce((sum, l) => sum + Number(l.estimatedCostUsd ?? 0), 0);
    const tokensIn = ledgers.reduce((sum, l) => sum + Number(l.tokensIn ?? 0), 0);
    const tokensOut = ledgers.reduce((sum, l) => sum + Number(l.tokensOut ?? 0), 0);
    const requestCount = ledgers.reduce((sum, l) => sum + Number(l.requestCount ?? 0), 0);

    const { start, end } = this.monthBounds(targetMonth);

    // Revenue: subscriptions that were live *during the selected month*, not the
    // ones live right now. Scoping cost to the month while leaving revenue at
    // today's MRR would compare last month's spend against this month's income
    // and report a margin for a combination that never existed.
    const subscriptions = await this.subscriptionsRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.plan', 'plan')
      .where('s.startedAt < :end', { end })
      .andWhere('(s.expiresAt IS NULL OR s.expiresAt >= :start)', { start })
      .andWhere('s.status IN (:...statuses)', {
        // A subscription cancelled or expired later was still billed for this
        // month, so restricting to ACTIVE would understate historical revenue.
        statuses: [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.CANCELLED,
          SubscriptionStatus.EXPIRED,
        ],
      })
      .getMany();

    const subscriptionRevenue = subscriptions.reduce((sum, s) => {
      const price = s.billingPeriod === BillingPeriod.YEARLY
        ? Number(s.plan?.price?.yearly ?? 0) / 12
        : Number(s.plan?.price?.monthly ?? 0);
      return sum + price;
    }, 0);

    const purchases = await this.purchasesRepository
      .createQueryBuilder('p')
      .where('p.status = :status', { status: TokenPurchaseStatus.COMPLETED })
      .andWhere('p.createdAt >= :start AND p.createdAt < :end', { start, end })
      .getMany();
    const topUpRevenue = purchases.reduce((sum, p) => sum + Number(p.amountTry ?? 0), 0);

    const revenueTry = subscriptionRevenue + topUpRevenue;
    const providerCostTry = usdToTry(providerCost);
    const articles = await this.countArticles(start, end);

    return {
      month: targetMonth,
      exchangeRate: usdTryRate(),
      providerCostUsd: Number(providerCost.toFixed(2)),
      providerCostTry: Number(providerCostTry.toFixed(2)),
      subscriptionRevenueTry: Number(subscriptionRevenue.toFixed(2)),
      topUpRevenueTry: Number(topUpRevenue.toFixed(2)),
      revenueTry: Number(revenueTry.toFixed(2)),
      grossProfitTry: Number((revenueTry - providerCostTry).toFixed(2)),
      grossMarginPct: grossMarginPct(revenueTry, providerCost),
      tokensIn,
      tokensOut,
      totalTokens: tokensIn + tokensOut,
      generationRequests: requestCount,
      articlesGenerated: articles,
      avgCostPerArticleUsd: articles > 0 ? Number((providerCost / articles).toFixed(4)) : null,
      avgCostPerArticleTry: articles > 0 ? Number((providerCostTry / articles).toFixed(2)) : null,
      activeSubscriptions: subscriptions.length,
    };
  }

  /** Observed cost per model, computed from real revisions rather than estimates. */
  async getModelBreakdown(month?: string) {
    const targetMonth = month || this.currentMonth();
    const { start, end } = this.monthBounds(targetMonth);

    const rows = await this.revisionsRepository
      .createQueryBuilder('r')
      .select('r.model', 'model')
      .addSelect('COUNT(*)', 'revisions')
      .addSelect('SUM(r.tokensIn)', 'tokensIn')
      .addSelect('SUM(r.tokensOut)', 'tokensOut')
      .where('r.createdAt >= :start AND r.createdAt < :end', { start, end })
      .andWhere('r.model IS NOT NULL')
      .groupBy('r.model')
      .getRawMany();

    return rows
      .map((row) => {
        const model = row.model as string;
        const tokensIn = Number(row.tokensIn ?? 0);
        const tokensOut = Number(row.tokensOut ?? 0);
        const revisions = Number(row.revisions ?? 0);
        const pricing = pricingForModel(model);
        const cost = calculateCostUsd(model, tokensIn, tokensOut);

        return {
          model,
          tier: tierForModel(model),
          revisions,
          tokensIn,
          tokensOut,
          inputPricePerMillionUsd: pricing.input,
          outputPricePerMillionUsd: pricing.output,
          totalCostUsd: Number(cost.toFixed(4)),
          totalCostTry: Number(usdToTry(cost).toFixed(2)),
          avgCostPerRevisionUsd: revisions > 0 ? Number((cost / revisions).toFixed(4)) : 0,
          avgCostPerRevisionTry:
            revisions > 0 ? Number(usdToTry(cost / revisions).toFixed(2)) : 0,
        };
      })
      .sort((a, b) => b.totalCostUsd - a.totalCostUsd);
  }

  /**
   * What-if calculator: price a hypothetical plan before creating it.
   * Answers "if I sell N tokens for ₺X on tier T, what is my margin?"
   */
  projectPlan(input: { tokenAllowance: number; monthlyPrice: number; tier?: string }) {
    const tier = (input.tier as ModelTier) ?? ModelTier.STANDARD;
    const def = TIER_DEFINITIONS[tier] ?? TIER_DEFINITIONS[ModelTier.STANDARD];
    const costAtFullUsageUsd =
      (input.tokenAllowance / 1_000_000) * blendedCostPerMillionTokens(def.tier);
    const costAtFullUsageTry = usdToTry(costAtFullUsageUsd);
    const articles = Math.floor(input.tokenAllowance / averageArticleTokens(def.tier));

    return {
      tier: def.tier,
      model: def.model,
      exchangeRate: usdTryRate(),
      tokenAllowance: input.tokenAllowance,
      monthlyPriceTry: input.monthlyPrice,
      estimatedArticles: articles,
      costAtFullUsageUsd: Number(costAtFullUsageUsd.toFixed(2)),
      costAtFullUsageTry: Number(costAtFullUsageTry.toFixed(2)),
      grossProfitTry: Number((input.monthlyPrice - costAtFullUsageTry).toFixed(2)),
      grossMarginPct: grossMarginPct(input.monthlyPrice, costAtFullUsageUsd),
      costPerArticleTry: Number(usdToTry(averageArticleCostUsd(def.tier)).toFixed(2)),
      /** Price floor for a target margin, so the admin can sanity-check a discount. */
      minPriceFor70PctMarginTry: Number((costAtFullUsageTry / 0.3).toFixed(2)),
    };
  }

  /** Margin on the pay-as-you-go packs, scored against every tier they can be spent on. */
  getTokenPackEconomics() {
    return TOKEN_PACK_BLUEPRINTS.map((pack) => {
      const pricePerMillionTry = pack.priceTry / (pack.tokens / 1_000_000);
      return Object.values(TIER_DEFINITIONS).reduce(
        (acc, def) => {
          const costUsd = (pack.tokens / 1_000_000) * blendedCostPerMillionTokens(def.tier);
          acc.marginByTier[def.tier] = {
            costUsd: Number(costUsd.toFixed(2)),
            costTry: Number(usdToTry(costUsd).toFixed(2)),
            grossMarginPct: grossMarginPct(pack.priceTry, costUsd),
          };
          return acc;
        },
        {
          key: pack.key,
          name: pack.name,
          tokens: pack.tokens,
          priceTry: pack.priceTry,
          pricePerMillionTry: Number(pricePerMillionTry.toFixed(2)),
          marginByTier: {} as Record<
            string,
            { costUsd: number; costTry: number; grossMarginPct: number | null }
          >,
        },
      );
    });
  }

  async getOverview(month?: string) {
    const [plans, actuals, models] = await Promise.all([
      this.getPlanEconomics(),
      this.getActuals(month),
      this.getModelBreakdown(month),
    ]);

    return {
      exchangeRate: usdTryRate(),
      currency: 'TRY',
      tiers: this.getTierEconomics(),
      plans,
      tokenPacks: this.getTokenPackEconomics(),
      actuals,
      models,
    };
  }

  /** Break-even article count, capped by what the plan's allowance actually permits. */
  private breakEvenArticles(
    monthlyPriceTry: number,
    costPerArticleTry: number,
    allowance: number | null,
    tier: ModelTier,
  ): number {
    if (monthlyPriceTry <= 0 || costPerArticleTry <= 0) return 0;
    const byPrice = Math.floor(monthlyPriceTry / costPerArticleTry);
    if (allowance === null) return byPrice;
    return Math.min(byPrice, Math.floor(allowance / averageArticleTokens(tier)));
  }

  private async countArticles(start: Date, end: Date): Promise<number> {
    return this.revisionsRepository
      .createQueryBuilder('r')
      .where('r.createdAt >= :start AND r.createdAt < :end', { start, end })
      .andWhere('r.editor = :editor', { editor: 'ai' })
      .getCount();
  }

  private monthBounds(month: string): { start: Date; end: Date } {
    const [year, m] = month.split('-').map(Number);
    return { start: new Date(year, m - 1, 1), end: new Date(year, m, 1) };
  }

  private currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
