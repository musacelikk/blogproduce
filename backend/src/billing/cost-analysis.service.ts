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

/**
 * Powers the admin cost calculator: what a blog actually costs us, what each
 * plan earns at full usage, and how projected margins compare to reality.
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
      inputPricePerMillion: def.pricing.input,
      outputPricePerMillion: def.pricing.output,
      reasoningFactor: def.reasoningFactor,
      blendedCostPerMillion: Number(blendedCostPerMillionTokens(def.tier).toFixed(2)),
      avgTokensPerArticle: averageArticleTokens(def.tier),
      avgCostPerArticle: Number(averageArticleCostUsd(def.tier).toFixed(4)),
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

      const monthlyPrice = Number(plan.price?.monthly ?? 0);
      const costAtFullUsage =
        allowance === null ? null : (allowance / 1_000_000) * blendedCostPerMillionTokens(defaultTier);

      const grossMarginPct =
        costAtFullUsage === null || monthlyPrice <= 0
          ? null
          : Number((((monthlyPrice - costAtFullUsage) / monthlyPrice) * 100).toFixed(1));

      return {
        planId: plan.id,
        key: plan.key,
        name: plan.name,
        level: plan.level,
        monthlyPrice,
        yearlyPrice: Number(plan.price?.yearly ?? 0),
        tokenAllowance: allowance,
        defaultTier,
        estimatedArticles:
          allowance === null ? null : Math.floor(allowance / averageArticleTokens(defaultTier)),
        costAtFullUsage: costAtFullUsage === null ? null : Number(costAtFullUsage.toFixed(2)),
        grossMarginPct,
        /** Articles a subscriber can generate before the plan stops being profitable. */
        breakEvenArticles:
          monthlyPrice > 0 ? Math.floor(monthlyPrice / averageArticleCostUsd(defaultTier)) : 0,
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

    // Revenue: active subscriptions normalised to a monthly figure, plus top-ups sold.
    const subscriptions = await this.subscriptionsRepository.find({
      where: { status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });
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
    const topUpRevenue = purchases.reduce((sum, p) => sum + Number(p.amountUsd ?? 0), 0);

    const revenue = subscriptionRevenue + topUpRevenue;
    const articles = await this.countArticles(start, end);

    return {
      month: targetMonth,
      providerCostUsd: Number(providerCost.toFixed(2)),
      subscriptionRevenueUsd: Number(subscriptionRevenue.toFixed(2)),
      topUpRevenueUsd: Number(topUpRevenue.toFixed(2)),
      revenueUsd: Number(revenue.toFixed(2)),
      grossProfitUsd: Number((revenue - providerCost).toFixed(2)),
      grossMarginPct: revenue > 0 ? Number((((revenue - providerCost) / revenue) * 100).toFixed(1)) : null,
      tokensIn,
      tokensOut,
      totalTokens: tokensIn + tokensOut,
      generationRequests: requestCount,
      articlesGenerated: articles,
      avgCostPerArticleUsd: articles > 0 ? Number((providerCost / articles).toFixed(4)) : null,
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
          inputPricePerMillion: pricing.input,
          outputPricePerMillion: pricing.output,
          totalCostUsd: Number(cost.toFixed(4)),
          avgCostPerRevisionUsd: revisions > 0 ? Number((cost / revisions).toFixed(4)) : 0,
        };
      })
      .sort((a, b) => b.totalCostUsd - a.totalCostUsd);
  }

  /**
   * What-if calculator: price a hypothetical plan before creating it.
   * Answers "if I sell N tokens for $X on tier T, what is my margin?"
   */
  projectPlan(input: { tokenAllowance: number; monthlyPrice: number; tier?: string }) {
    const tier = (input.tier as ModelTier) ?? ModelTier.STANDARD;
    const def = TIER_DEFINITIONS[tier] ?? TIER_DEFINITIONS[ModelTier.STANDARD];
    const costAtFullUsage = (input.tokenAllowance / 1_000_000) * blendedCostPerMillionTokens(def.tier);
    const articles = Math.floor(input.tokenAllowance / averageArticleTokens(def.tier));

    return {
      tier: def.tier,
      model: def.model,
      tokenAllowance: input.tokenAllowance,
      monthlyPrice: input.monthlyPrice,
      estimatedArticles: articles,
      costAtFullUsageUsd: Number(costAtFullUsage.toFixed(2)),
      grossProfitUsd: Number((input.monthlyPrice - costAtFullUsage).toFixed(2)),
      grossMarginPct:
        input.monthlyPrice > 0
          ? Number((((input.monthlyPrice - costAtFullUsage) / input.monthlyPrice) * 100).toFixed(1))
          : null,
      costPerArticleUsd: Number(averageArticleCostUsd(def.tier).toFixed(4)),
      /** Price floor for a target margin, so the admin can sanity-check a discount. */
      minPriceFor70PctMargin: Number((costAtFullUsage / 0.3).toFixed(2)),
    };
  }

  /** Margin on the pay-as-you-go packs. */
  getTokenPackEconomics() {
    return TOKEN_PACK_BLUEPRINTS.map((pack) => {
      const pricePerMillion = pack.priceUsd / (pack.tokens / 1_000_000);
      return Object.values(TIER_DEFINITIONS).reduce(
        (acc, def) => {
          const cost = (pack.tokens / 1_000_000) * blendedCostPerMillionTokens(def.tier);
          acc.marginByTier[def.tier] = {
            costUsd: Number(cost.toFixed(2)),
            grossMarginPct: Number((((pack.priceUsd - cost) / pack.priceUsd) * 100).toFixed(1)),
          };
          return acc;
        },
        {
          key: pack.key,
          name: pack.name,
          tokens: pack.tokens,
          priceUsd: pack.priceUsd,
          pricePerMillionUsd: Number(pricePerMillion.toFixed(2)),
          marginByTier: {} as Record<string, { costUsd: number; grossMarginPct: number }>,
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
      tiers: this.getTierEconomics(),
      plans,
      tokenPacks: this.getTokenPackEconomics(),
      actuals,
      models,
    };
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
