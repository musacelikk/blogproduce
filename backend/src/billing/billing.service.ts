import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { PlanDefinition } from '../entities/plan-definition.entity';
import {
  Subscription,
  SubscriptionStatus,
  BillingPeriod,
} from '../entities/subscription.entity';
import { UsageLedger } from '../entities/usage-ledger.entity';
import { TokenPack } from '../entities/token-pack.entity';
import { TokenPurchase, TokenPurchaseStatus } from '../entities/token-purchase.entity';
import { Payment, PaymentMethod, PaymentStatus } from '../entities/payment.entity';
import { ModelTier, TIER_DEFINITIONS, averageArticleTokens, normalizeTier } from './model-tiers';
import { PLAN_BLUEPRINTS, TRIAL_DAYS } from './plan-catalog';
import {
  bankAccountDetails,
  generateReferenceCode,
  PAYMENT_REQUEST_TTL_DAYS,
} from './bank-transfer';

/** What a user is entitled to right now — the single answer every quota question reads. */
export interface Entitlement {
  planName: string;
  planLevel: string;
  isTrial: boolean;
  trialEndsAt: Date | null;
  trialDaysRemaining: number | null;
  /** True when the trial or the paid subscription has lapsed. */
  isExpired: boolean;
  tokenAllowance: number;
  tokensUsedThisMonth: number;
  tokensRemainingInPlan: number;
  /** Purchased pay-as-you-go tokens. */
  tokenBalance: number;
  /** Plan remainder + top-up balance. */
  totalTokensRemaining: number;
  allowedTiers: ModelTier[];
  defaultTier: ModelTier;
  maxWorkspaces: number | 'unlimited';
  estimatedArticlesRemaining: number;
}

const FREE_FALLBACK = {
  name: 'Ücretsiz',
  level: 'trial',
  tokenAllowance: 0,
  allowedTiers: [ModelTier.STANDARD] as ModelTier[],
  defaultTier: ModelTier.STANDARD,
  maxWorkspaces: 1 as number | 'unlimited',
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(PlanDefinition) private plansRepository: Repository<PlanDefinition>,
    @InjectRepository(Subscription) private subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(UsageLedger) private usageLedgerRepository: Repository<UsageLedger>,
    @InjectRepository(TokenPack) private tokenPacksRepository: Repository<TokenPack>,
    @InjectRepository(TokenPurchase) private tokenPurchasesRepository: Repository<TokenPurchase>,
    @InjectRepository(Payment) private paymentsRepository: Repository<Payment>,
    private dataSource: DataSource,
  ) {}

  /** Start the free trial for a newly registered user. Idempotent. */
  async startTrial(userId: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || user.trialEndsAt || user.planId) return;

    const trialPlan = await this.plansRepository.findOne({ where: { level: 'trial' as any } });
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + TRIAL_DAYS);

    await this.usersRepository.update(userId, {
      trialEndsAt: endsAt,
      ...(trialPlan ? { planId: trialPlan.id } : {}),
    });

    this.logger.log(`Trial started for user ${userId} until ${endsAt.toISOString()}`);
  }

  async getEntitlement(userId: string): Promise<Entitlement> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const now = new Date();

    // A paid subscription always wins over the trial.
    const subscription = await this.subscriptionsRepository.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
      order: { startedAt: 'DESC' },
    });

    let plan: PlanDefinition | null = subscription?.plan ?? null;
    if (!plan && user.planId) {
      plan = await this.plansRepository.findOne({ where: { id: user.planId } });
    }

    const isTrial = !subscription && !!user.trialEndsAt;
    const trialEndsAt = isTrial ? user.trialEndsAt : null;
    const trialDaysRemaining = trialEndsAt
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / 86_400_000))
      : null;

    const subscriptionExpired = !!(subscription?.expiresAt && subscription.expiresAt < now);
    const trialExpired = !!(trialEndsAt && trialEndsAt < now);
    const isExpired = subscription ? subscriptionExpired : trialExpired;

    // A trialling user with no trial plan row (catalog not seeded yet) still gets
    // the blueprint's allowance rather than silently dropping to zero.
    const shape = plan
      ? this.planShape(plan)
      : isTrial
        ? this.trialShape()
        : this.planShape(null);

    // An expired plan keeps its tier permissions but grants no fresh allowance —
    // the user can still spend top-up tokens they already paid for.
    const tokenAllowance = isExpired ? 0 : shape.tokenAllowance;

    const tokensUsedThisMonth = await this.tokensUsedThisMonth(userId);
    const tokensRemainingInPlan = Math.max(0, tokenAllowance - tokensUsedThisMonth);
    const tokenBalance = Number(user.tokenBalance ?? 0);
    const totalTokensRemaining = tokensRemainingInPlan + tokenBalance;

    return {
      planName: plan?.name ?? (isTrial ? 'Ücretsiz Deneme' : FREE_FALLBACK.name),
      planLevel: shape.level,
      isTrial,
      trialEndsAt,
      trialDaysRemaining,
      isExpired,
      tokenAllowance,
      tokensUsedThisMonth,
      tokensRemainingInPlan,
      tokenBalance,
      totalTokensRemaining,
      allowedTiers: shape.allowedTiers,
      defaultTier: shape.defaultTier,
      maxWorkspaces: shape.maxWorkspaces,
      estimatedArticlesRemaining: Math.floor(
        totalTokensRemaining / averageArticleTokens(shape.defaultTier),
      ),
    };
  }

  /**
   * Gate a generation request. Throws with an actionable Turkish message when the
   * user cannot proceed; returns the tier the request will actually run on.
   */
  async authorizeGeneration(userId: string, requestedTier?: string): Promise<ModelTier> {
    const entitlement = await this.getEntitlement(userId);

    if (entitlement.isExpired && entitlement.tokenBalance <= 0) {
      throw new ForbiddenException(
        entitlement.isTrial
          ? 'Deneme süreniz sona erdi. Devam etmek için bir plan seçin.'
          : 'Aboneliğinizin süresi doldu. Devam etmek için planınızı yenileyin.',
      );
    }

    const tier = normalizeTier(requestedTier) ?? entitlement.defaultTier;

    if (!entitlement.allowedTiers.includes(tier)) {
      const label = TIER_DEFINITIONS[tier].label;
      throw new ForbiddenException(
        `${label} kalite seviyesi mevcut planınıza dahil değil. Planınızı yükselterek kullanabilirsiniz.`,
      );
    }

    const needed = averageArticleTokens(tier);
    if (entitlement.totalTokensRemaining < needed) {
      throw new ForbiddenException(
        `Token bakiyeniz bu içerik için yetersiz (kalan: ${entitlement.totalTokensRemaining.toLocaleString('tr-TR')}). ` +
          'Ek token paketi alabilir veya planınızı yükseltebilirsiniz.',
      );
    }

    return tier;
  }

  /**
   * Draw consumed tokens from the top-up balance once the monthly allowance is
   * spent. Called after usage is recorded, so the ledger stays the source of truth.
   */
  async settleTokenBalance(userId: string, tokensConsumed: number): Promise<void> {
    if (tokensConsumed <= 0) return;

    const entitlement = await this.getEntitlement(userId);
    // tokensUsedThisMonth already includes this request; anything past the
    // allowance has to come out of purchased tokens.
    const overflow = Math.max(
      0,
      Math.min(tokensConsumed, entitlement.tokensUsedThisMonth - entitlement.tokenAllowance),
    );
    if (overflow <= 0) return;

    await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ tokenBalance: () => `GREATEST(token_balance - ${Math.round(overflow)}, 0)` })
      .where('id = :userId', { userId })
      .execute();
  }

  async listTokenPacks(): Promise<TokenPack[]> {
    return this.tokenPacksRepository.find({
      where: { active: true },
      order: { sortOrder: 'ASC', priceTry: 'ASC' },
    });
  }

  /** Credit an arbitrary token amount (admin grant, refund, migration). */
  async creditTokens(
    userId: string,
    tokens: number,
    amountTry: number,
    tokenPackId: string | null = null,
    note?: string,
  ): Promise<{ tokens: number; balance: number }> {
    return this.dataSource.transaction(async (manager) => {
      await manager.insert(TokenPurchase, {
        userId,
        tokenPackId,
        tokens,
        amountTry,
        status: TokenPurchaseStatus.COMPLETED,
        note: note ?? null,
      });

      await manager
        .createQueryBuilder()
        .update(User)
        .set({ tokenBalance: () => `token_balance + ${Math.round(tokens)}` })
        .where('id = :userId', { userId })
        .execute();

      const user = await manager.findOne(User, { where: { id: userId } });
      return { tokens, balance: Number(user?.tokenBalance ?? 0) };
    });
  }

  async getPurchaseHistory(userId: string): Promise<TokenPurchase[]> {
    return this.tokenPurchasesRepository.find({
      where: { userId },
      relations: ['tokenPack'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  // ── Bank transfer (havale / EFT) ────────────────────────────────────────
  //
  // A bank transfer has no callback: money arrives in a bank statement, not a
  // webhook. So the flow is deliberately two-phase — the customer creates a
  // *pending* order and an admin confirms it against the statement. Nothing is
  // granted until confirmation, and confirmation is the only place fulfilment
  // happens.

  getBankDetails() {
    return bankAccountDetails();
  }

  /**
   * Open an order and hand back the reference code the customer must quote in
   * the transfer description. Grants nothing on its own.
   */
  async createPaymentRequest(
    userId: string,
    input: { type: 'plan' | 'token_pack'; planKey?: string; packId?: string; yearly?: boolean },
  ): Promise<Payment> {
    const details = bankAccountDetails();
    if (!details.configured) {
      throw new BadRequestException(
        'Havale ile ödeme şu anda kullanılamıyor. Lütfen bizimle iletişime geçin.',
      );
    }

    // One open order at a time: a second pending row for the same user makes an
    // incoming transfer ambiguous to match.
    const existing = await this.paymentsRepository.findOne({
      where: { userId, status: PaymentStatus.PENDING, referenceCode: Not(IsNull()) },
    });
    if (existing) {
      throw new ConflictException(
        `Bekleyen bir ödemeniz var (${existing.referenceCode}). ` +
          'Devam etmek için onu tamamlayın veya iptal edin.',
      );
    }

    const draft =
      input.type === 'token_pack'
        ? await this.tokenPackOrder(input.packId)
        : await this.planOrder(input.planKey, input.yearly === true);

    const payment = this.paymentsRepository.create({
      userId,
      ...draft,
      currency: 'TRY',
      status: PaymentStatus.PENDING,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      referenceCode: generateReferenceCode(),
    });

    return this.paymentsRepository.save(payment);
  }

  private async tokenPackOrder(packId?: string): Promise<Partial<Payment>> {
    if (!packId) throw new BadRequestException('Token paketi seçilmedi');

    const pack = await this.tokenPacksRepository.findOne({ where: { id: packId, active: true } });
    if (!pack) throw new NotFoundException('Token paketi bulunamadı');

    // Amount and token count are snapshotted, so editing the catalog later
    // cannot change what an already-placed order is worth.
    return {
      tokenPackId: pack.id,
      tokens: Number(pack.tokens),
      amount: Number(pack.priceTry),
      notes: `${pack.name} token paketi`,
    };
  }

  private async planOrder(planKey: string | undefined, yearly: boolean): Promise<Partial<Payment>> {
    if (!planKey) throw new BadRequestException('Plan seçilmedi');

    const plan = await this.plansRepository.findOne({ where: { key: planKey } });
    if (!plan) throw new NotFoundException('Plan bulunamadı');

    const amount = yearly ? Number(plan.price?.yearly ?? 0) : Number(plan.price?.monthly ?? 0);
    if (amount <= 0) {
      throw new BadRequestException('Bu plan için havale ile ödeme alınamıyor.');
    }

    return {
      planId: plan.id,
      amount,
      billingPeriod: yearly ? BillingPeriod.YEARLY : BillingPeriod.MONTHLY,
      notes: `${plan.name} planı (${yearly ? 'yıllık' : 'aylık'})`,
    };
  }

  async listMyPayments(userId: string): Promise<Payment[]> {
    return this.paymentsRepository.find({
      where: { userId },
      relations: ['plan', 'tokenPack'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async cancelPaymentRequest(userId: string, paymentId: string): Promise<void> {
    const result = await this.paymentsRepository.update(
      { id: paymentId, userId, status: PaymentStatus.PENDING },
      { status: PaymentStatus.CANCELLED, reviewedAt: new Date() },
    );
    if (!result.affected) {
      throw new NotFoundException('İptal edilebilecek bekleyen bir ödeme bulunamadı');
    }
  }

  /** The admin inbox: orders waiting to be matched against the bank statement. */
  async listPendingPayments(): Promise<Payment[]> {
    return this.paymentsRepository.find({
      where: { status: PaymentStatus.PENDING, referenceCode: Not(IsNull()) },
      relations: ['user', 'plan', 'tokenPack'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Confirm that the money arrived, then fulfil the order.
   *
   * The status transition is a conditional UPDATE rather than a read-then-write:
   * two admins confirming the same transfer at once would otherwise both pass the
   * check and credit the tokens twice. Only the update that actually moved the
   * row from `pending` proceeds to fulfilment.
   */
  async confirmPayment(paymentId: string, adminId: string, note?: string): Promise<Payment> {
    const claimed = await this.paymentsRepository
      .createQueryBuilder()
      .update(Payment)
      .set({
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
        reviewedAt: new Date(),
        reviewedById: adminId,
        ...(note ? { notes: note } : {}),
      })
      .where('id = :paymentId AND status = :pending', {
        paymentId,
        pending: PaymentStatus.PENDING,
      })
      .execute();

    if (!claimed.affected) {
      throw new ConflictException('Bu ödeme zaten işlenmiş veya bulunamadı');
    }

    const payment = await this.paymentsRepository.findOne({
      where: { id: paymentId },
      relations: ['plan', 'tokenPack'],
    });
    if (!payment) throw new NotFoundException('Ödeme bulunamadı');

    if (payment.tokenPackId || payment.tokens) {
      await this.creditTokens(
        payment.userId,
        Number(payment.tokens ?? 0),
        Number(payment.amount ?? 0),
        payment.tokenPackId,
        `Havale onayı — ${payment.referenceCode}`,
      );
    } else if (payment.planId) {
      await this.activatePlan(payment);
    }

    this.logger.log(
      `Ödeme onaylandı: ${payment.referenceCode} (kullanıcı ${payment.userId}, ${payment.amount} TRY)`,
    );
    return payment;
  }

  async rejectPayment(paymentId: string, adminId: string, reason?: string): Promise<void> {
    const result = await this.paymentsRepository.update(
      { id: paymentId, status: PaymentStatus.PENDING },
      {
        status: PaymentStatus.FAILED,
        reviewedAt: new Date(),
        reviewedById: adminId,
        notes: reason ?? 'Ödeme doğrulanamadı',
      },
    );
    if (!result.affected) {
      throw new ConflictException('Bu ödeme zaten işlenmiş veya bulunamadı');
    }
  }

  /**
   * Start (or extend) a paid subscription. Extending from the current expiry
   * rather than from today means a customer who renews early keeps the days they
   * already paid for.
   */
  private async activatePlan(payment: Payment): Promise<void> {
    const yearly = payment.billingPeriod === BillingPeriod.YEARLY;

    const current = await this.subscriptionsRepository.findOne({
      where: { userId: payment.userId, status: SubscriptionStatus.ACTIVE },
      order: { startedAt: 'DESC' },
    });

    const now = new Date();
    const base =
      current?.expiresAt && current.expiresAt > now ? new Date(current.expiresAt) : new Date(now);
    const expiresAt = new Date(base);
    if (yearly) expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);

    await this.dataSource.transaction(async (manager) => {
      if (current) {
        await manager.update(Subscription, { id: current.id }, {
          status: SubscriptionStatus.EXPIRED,
          cancelledAt: now,
        });
      }

      const subscription = await manager.save(
        manager.create(Subscription, {
          userId: payment.userId,
          planId: payment.planId!,
          status: SubscriptionStatus.ACTIVE,
          billingPeriod: yearly ? BillingPeriod.YEARLY : BillingPeriod.MONTHLY,
          startedAt: now,
          expiresAt,
          autoRenew: false, // bank transfer is collected manually each period
        }),
      );

      await manager.update(Payment, { id: payment.id }, { subscriptionId: subscription.id });
      // Clear the trial: the user is on a paid plan now.
      await manager.update(User, { id: payment.userId }, {
        planId: payment.planId!,
        trialEndsAt: null,
      });
    });
  }

  /** Orders abandoned past the quote window, so the inbox stays meaningful. */
  async expireStalePaymentRequests(): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - PAYMENT_REQUEST_TTL_DAYS);

    const result = await this.paymentsRepository
      .createQueryBuilder()
      .update(Payment)
      .set({ status: PaymentStatus.CANCELLED, notes: 'Süresi doldu' })
      .where('status = :pending AND "createdAt" < :cutoff', {
        pending: PaymentStatus.PENDING,
        cutoff,
      })
      .execute();

    return result.affected ?? 0;
  }

  private async tokensUsedThisMonth(userId: string): Promise<number> {
    const ledger = await this.usageLedgerRepository.findOne({
      where: { userId, month: this.currentMonth() },
    });
    if (!ledger) return 0;
    return Number(ledger.tokensIn ?? 0) + Number(ledger.tokensOut ?? 0);
  }

  /** Read a plan's commercial shape, falling back to the blueprint for legacy rows. */
  private planShape(plan: PlanDefinition | null) {
    if (!plan) return { ...FREE_FALLBACK };

    const features: any = plan.features ?? {};
    const blueprint = PLAN_BLUEPRINTS.find((b) => b.level === (plan.level as any));

    const allowedTiers: ModelTier[] = Array.isArray(features.allowedTiers)
      ? features.allowedTiers.map((t: string) => normalizeTier(t)).filter(Boolean)
      : (blueprint?.allowedTiers ?? FREE_FALLBACK.allowedTiers);

    const rawAllowance = features.maxTokensPerMonth;
    const tokenAllowance =
      rawAllowance === 'unlimited'
        ? Number.MAX_SAFE_INTEGER
        : Number(rawAllowance ?? blueprint?.tokenAllowance ?? 0);

    return {
      level: plan.level as string,
      tokenAllowance,
      allowedTiers: allowedTiers.length ? allowedTiers : FREE_FALLBACK.allowedTiers,
      defaultTier:
        normalizeTier(features.defaultTier) ?? blueprint?.defaultTier ?? FREE_FALLBACK.defaultTier,
      maxWorkspaces: (features.maxWorkspaces ?? blueprint?.maxWorkspaces ?? 1) as
        | number
        | 'unlimited',
    };
  }

  /** Entitlement of the free trial, straight from the catalog blueprint. */
  private trialShape() {
    const blueprint = PLAN_BLUEPRINTS.find((b) => b.level === 'trial');
    if (!blueprint) return { ...FREE_FALLBACK };

    return {
      level: blueprint.level as string,
      tokenAllowance: blueprint.tokenAllowance,
      allowedTiers: blueprint.allowedTiers,
      defaultTier: blueprint.defaultTier,
      maxWorkspaces: blueprint.maxWorkspaces,
    };
  }

  private currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
