import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsageLedger } from '../entities/usage-ledger.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { PostRevision } from '../entities/post-revision.entity';
import { Workspace } from '../entities/workspace.entity';

// Model pricing per 1M tokens (2025-2026)
// Tiers: standart → gpt-4.1-mini · pro → gpt-4.1 · premium → claude-opus-5
const PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4.1-mini': { input: 0.40, output: 1.60 },
  'gpt-4.1': { input: 2.00, output: 8.00 },

  // Anthropic (premium tier)
  'claude-opus-5': { input: 5.00, output: 25.00 },
  'claude-opus-4-8': { input: 5.00, output: 25.00 },
  'claude-sonnet-5': { input: 3.00, output: 15.00 },
  'claude-haiku-4-5': { input: 1.00, output: 5.00 },

  // Legacy models (for backward compatibility)
  'gpt-4o': { input: 0.15, output: 0.60 }, // Map to gpt-4o-mini pricing
  'gpt-4': { input: 2.00, output: 8.00 }, // Map to gpt-4.1 pricing
  'gpt-4-turbo': { input: 0.40, output: 1.60 }, // Map to gpt-4.1-mini pricing
  'gpt-3.5-turbo': { input: 0.15, output: 0.60 }, // Map to gpt-4o-mini pricing
};

const DEFAULT_PRICING = { input: 0.40, output: 1.60 }; // Default to gpt-4.1-mini (Orta seviye)
const MONTHLY_LIMIT_USD = 10.0;

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(
    @InjectRepository(UsageLedger)
    private usageLedgerRepository: Repository<UsageLedger>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(PostRevision)
    private postRevisionsRepository: Repository<PostRevision>,
    @InjectRepository(Workspace)
    private workspacesRepository: Repository<Workspace>,
  ) {}

  /**
   * Check if user has exceeded monthly limit
   */
  async checkMonthlyLimit(userId: string): Promise<void> {
    const currentMonth = this.getCurrentMonth();
    const ledger = await this.usageLedgerRepository.findOne({
      where: { userId, month: currentMonth },
    });

    // Postgres decimal columns hydrate as strings — coerce before any numeric use.
    const currentCost = Number(ledger?.estimatedCostUsd || 0);

    if (currentCost >= MONTHLY_LIMIT_USD) {
      this.logger.warn(`User ${userId} exceeded monthly limit: $${currentCost.toFixed(2)}`);
      throw new ForbiddenException(
        `Monthly usage limit exceeded. Current usage: $${currentCost.toFixed(2)} / $${MONTHLY_LIMIT_USD}. Please wait until next month or contact support.`,
      );
    }
  }

  /**
   * Record token usage and calculate cost
   */
  async recordUsage(
    userId: string,
    model: string,
    tokensIn: number,
    tokensOut: number,
  ): Promise<UsageLedger> {
    const currentMonth = this.getCurrentMonth();
    const cost = this.calculateCost(model, tokensIn, tokensOut);

    // Atomic upsert. The worker records usage once per pipeline stage and runs jobs
    // concurrently, so a read-modify-write would lose increments and race on insert.
    await this.usageLedgerRepository.query(
      `INSERT INTO usage_ledger (user_id, month, estimated_cost_usd, tokens_in, tokens_out, request_count)
       VALUES ($1, $2, $3, $4, $5, 1)
       ON CONFLICT (user_id, month) DO UPDATE SET
         estimated_cost_usd = usage_ledger.estimated_cost_usd + EXCLUDED.estimated_cost_usd,
         tokens_in          = usage_ledger.tokens_in + EXCLUDED.tokens_in,
         tokens_out         = usage_ledger.tokens_out + EXCLUDED.tokens_out,
         request_count      = usage_ledger.request_count + 1`,
      [userId, currentMonth, cost, tokensIn, tokensOut],
    );

    const saved = await this.usageLedgerRepository.findOne({
      where: { userId, month: currentMonth },
    });

    this.logger.log(
      `Usage recorded for user ${userId}: $${cost.toFixed(4)} (Total: $${Number(saved?.estimatedCostUsd ?? 0).toFixed(2)})`,
    );

    return saved as UsageLedger;
  }

  /**
   * Get current month usage for a user
   */
  async getCurrentMonthUsage(userId: string): Promise<UsageLedger | null> {
    const currentMonth = this.getCurrentMonth();
    return this.usageLedgerRepository.findOne({
      where: { userId, month: currentMonth },
    });
  }

  /**
   * Get all usage history for a user
   */
  async getUserUsageHistory(userId: string): Promise<UsageLedger[]> {
    return this.usageLedgerRepository.find({
      where: { userId },
      order: { month: 'DESC' },
    });
  }

  /**
   * Get all users usage (admin)
   */
  async getAllUsage(month?: string): Promise<UsageLedger[]> {
    const where: any = {};
    if (month) {
      where.month = month;
    }

    return this.usageLedgerRepository.find({
      where,
      relations: ['user'],
      order: { month: 'DESC', estimatedCostUsd: 'DESC' },
    });
  }

  /**
   * Get usage statistics (admin)
   */
  async getUsageStats(month?: string) {
    const currentMonth = month || this.getCurrentMonth();
    const allUsage = await this.getAllUsage(currentMonth);

    const totalCost = allUsage.reduce((sum, ledger) => sum + Number(ledger.estimatedCostUsd), 0);
    const totalTokensIn = allUsage.reduce((sum, ledger) => sum + Number(ledger.tokensIn), 0);
    const totalTokensOut = allUsage.reduce((sum, ledger) => sum + Number(ledger.tokensOut), 0);
    const totalRequests = allUsage.reduce((sum, ledger) => sum + ledger.requestCount, 0);
    const activeUsers = allUsage.length;

    return {
      month: currentMonth,
      totalCost,
      totalTokensIn,
      totalTokensOut,
      totalRequests,
      activeUsers,
      usageByUser: allUsage.map((ledger) => ({
        userId: ledger.userId,
        userEmail: ledger.user?.email || 'N/A',
        cost: Number(ledger.estimatedCostUsd),
        tokensIn: Number(ledger.tokensIn),
        tokensOut: Number(ledger.tokensOut),
        requestCount: ledger.requestCount,
      })),
    };
  }

  /**
   * Calculate cost based on model and tokens
   */
  private calculateCost(model: string, tokensIn: number, tokensOut: number): number {
    // Exact match first, then longest-prefix match (providers may return dated ids
    // like "gpt-4.1-2025-04-14"), then default.
    let pricing = PRICING[model];
    if (!pricing) {
      const prefixKey = Object.keys(PRICING)
        .filter((key) => model.startsWith(key))
        .sort((a, b) => b.length - a.length)[0];
      pricing = prefixKey ? PRICING[prefixKey] : DEFAULT_PRICING;
    }
    const inputCost = (tokensIn / 1_000_000) * pricing.input;
    const outputCost = (tokensOut / 1_000_000) * pricing.output;
    return inputCost + outputCost;
  }

  /**
   * Get workspace-based token usage for a user
   */
  async getWorkspaceUsage(userId: string, month?: string): Promise<Array<{
    workspaceId: string;
    workspaceName: string;
    tokensIn: number;
    tokensOut: number;
    totalTokens: number;
    requestCount: number;
  }>> {
    const targetMonth = month || this.getCurrentMonth();
    const startDate = new Date(`${targetMonth}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);

    // Get all revisions with their posts and workspaces
    const revisions = await this.postRevisionsRepository
      .createQueryBuilder('revision')
      .innerJoinAndSelect('revision.post', 'post')
      .innerJoinAndSelect('post.workspace', 'workspace')
      .where('post.authorId = :userId', { userId })
      .andWhere('revision.createdAt >= :startDate', { startDate })
      .andWhere('revision.createdAt <= :endDate', { endDate })
      .andWhere('(revision.tokensIn IS NOT NULL OR revision.tokensOut IS NOT NULL)')
      .getMany();

    // Group by workspace
    const workspaceMap = new Map<string, {
      workspaceId: string;
      workspaceName: string;
      tokensIn: number;
      tokensOut: number;
      requestCount: number;
    }>();

    revisions.forEach((revision) => {
      const workspaceId = revision.post.workspaceId;
      if (!workspaceId) return; // Skip if no workspace (multi-tenant migration)
      
      const workspaceName = revision.post.workspace?.name || 'Bilinmeyen Workspace';

      if (!workspaceMap.has(workspaceId)) {
        workspaceMap.set(workspaceId, {
          workspaceId,
          workspaceName,
          tokensIn: 0,
          tokensOut: 0,
          requestCount: 0,
        });
      }

      const usage = workspaceMap.get(workspaceId)!;
      usage.tokensIn += revision.tokensIn || 0;
      usage.tokensOut += revision.tokensOut || 0;
      usage.requestCount += 1;
    });

    // Convert to array and add totalTokens
    return Array.from(workspaceMap.values()).map((usage) => ({
      ...usage,
      totalTokens: usage.tokensIn + usage.tokensOut,
    })).sort((a, b) => b.totalTokens - a.totalTokens);
  }

  /**
   * Get current month in YYYY-MM format
   */
  private getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}

