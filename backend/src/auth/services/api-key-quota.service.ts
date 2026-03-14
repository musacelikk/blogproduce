import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../../entities/api-key.entity';

@Injectable()
export class ApiKeyQuotaService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  /**
   * Check if API key has enough token budget for the request
   * @param apiKeyId API key ID
   * @param estimatedTokens Estimated tokens that will be used
   * @throws HttpException if budget exceeded
   */
  async checkTokenBudget(apiKeyId: string, estimatedTokens: number): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: apiKeyId },
    });

    if (!apiKey) {
      return; // API key not found, skip check (shouldn't happen)
    }

    // If no monthly budget set, allow unlimited
    if (apiKey.monthlyTokenBudget === null) {
      return;
    }

    // Reset monthly budget if needed
    await this.resetMonthlyBudgetIfNeeded(apiKey);

    // Check if budget is exceeded
    if (apiKey.currentMonthTokensUsed + estimatedTokens > apiKey.monthlyTokenBudget) {
      const remaining = Math.max(0, apiKey.monthlyTokenBudget - apiKey.currentMonthTokensUsed);
      throw new HttpException(
        {
          success: false,
          message: `Monthly token budget exceeded. Remaining: ${remaining} tokens`,
          error: 'MONTHLY_TOKEN_BUDGET_EXCEEDED',
          remaining: remaining,
          requested: estimatedTokens,
          budget: apiKey.monthlyTokenBudget,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  /**
   * Record token usage for API key
   * @param apiKeyId API key ID
   * @param tokensUsed Tokens used in this request
   */
  async recordTokenUsage(apiKeyId: string, tokensUsed: number): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: apiKeyId },
    });

    if (!apiKey) {
      return;
    }

    // Reset monthly budget if needed
    await this.resetMonthlyBudgetIfNeeded(apiKey);

    // Update token usage
    apiKey.currentMonthTokensUsed += tokensUsed;
    await this.apiKeyRepository.save(apiKey);
  }

  /**
   * Reset monthly budget if we're in a new month
   */
  private async resetMonthlyBudgetIfNeeded(apiKey: ApiKey): Promise<void> {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (!apiKey.currentMonthResetDate) {
      // First time, set reset date
      apiKey.currentMonthResetDate = new Date(now.getFullYear(), now.getMonth(), 1);
      apiKey.currentMonthTokensUsed = 0;
      await this.apiKeyRepository.save(apiKey);
      return;
    }

    const resetDate = new Date(apiKey.currentMonthResetDate);
    const resetMonth = `${resetDate.getFullYear()}-${String(resetDate.getMonth() + 1).padStart(2, '0')}`;

    if (currentMonth !== resetMonth) {
      // New month, reset budget
      apiKey.currentMonthResetDate = new Date(now.getFullYear(), now.getMonth(), 1);
      apiKey.currentMonthTokensUsed = 0;
      await this.apiKeyRepository.save(apiKey);
    }
  }

  /**
   * Get remaining token budget for API key
   */
  async getRemainingBudget(apiKeyId: string): Promise<number | null> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: apiKeyId },
    });

    if (!apiKey || apiKey.monthlyTokenBudget === null) {
      return null; // Unlimited
    }

    await this.resetMonthlyBudgetIfNeeded(apiKey);

    return Math.max(0, apiKey.monthlyTokenBudget - apiKey.currentMonthTokensUsed);
  }
}

