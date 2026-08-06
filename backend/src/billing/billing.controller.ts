import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Public } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User, UserRole } from '../entities/user.entity';
import { BillingService } from './billing.service';
import { CostAnalysisService } from './cost-analysis.service';
import { TIER_DEFINITIONS } from './model-tiers';
import { ProjectPlanDto } from './dto/project-plan.dto';
import { PurchaseTokensDto } from './dto/purchase-tokens.dto';
import { GrantTokensDto } from './dto/grant-tokens.dto';

@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(
    private billingService: BillingService,
    private costAnalysis: CostAnalysisService,
  ) {}

  /** Quality tiers shown on pricing and in the generate form. */
  @Get('tiers')
  @Public()
  getTiers() {
    return {
      success: true,
      data: Object.values(TIER_DEFINITIONS).map((def) => ({
        tier: def.tier,
        label: def.label,
        description: def.description,
      })),
    };
  }

  @Get('token-packs')
  @Public()
  async getTokenPacks() {
    return { success: true, data: await this.billingService.listTokenPacks() };
  }

  /** The caller's plan, allowance, usage and trial state — drives the dashboard meters. */
  @Get('entitlement')
  async getEntitlement(@CurrentUser() user: User) {
    return { success: true, data: await this.billingService.getEntitlement(user.id) };
  }

  @Get('purchases')
  async getPurchases(@CurrentUser() user: User) {
    return { success: true, data: await this.billingService.getPurchaseHistory(user.id) };
  }

  /**
   * Fulfil a top-up. Payment capture is handled by the payment provider flow;
   * this credits the balance once that succeeds.
   */
  @Post('token-packs/:packId/purchase')
  async purchaseTokens(
    @CurrentUser() user: User,
    @Param('packId') packId: string,
    @Body() dto: PurchaseTokensDto,
  ) {
    const result = await this.billingService.grantTokenPack(user.id, packId, dto.reference);
    return {
      success: true,
      message: `${result.tokens.toLocaleString('tr-TR')} token hesabınıza eklendi.`,
      data: result,
    };
  }

  // ── Admin: cost calculator ────────────────────────────────────────────

  @Get('admin/cost-analysis')
  @Roles(UserRole.ADMIN)
  async getCostAnalysis(@Query('month') month?: string) {
    return { success: true, data: await this.costAnalysis.getOverview(month) };
  }

  @Get('admin/cost-analysis/actuals')
  @Roles(UserRole.ADMIN)
  async getActuals(@Query('month') month?: string) {
    return { success: true, data: await this.costAnalysis.getActuals(month) };
  }

  /** What-if pricing: score a hypothetical plan before creating it. */
  @Post('admin/cost-analysis/project')
  @Roles(UserRole.ADMIN)
  projectPlan(@Body() dto: ProjectPlanDto) {
    return {
      success: true,
      data: this.costAnalysis.projectPlan({
        tokenAllowance: dto.tokenAllowance,
        monthlyPrice: dto.monthlyPrice,
        tier: dto.tier,
      }),
    };
  }

  /** Manually credit tokens to a user (support gesture, migration, refund). */
  @Post('admin/users/:userId/grant-tokens')
  @Roles(UserRole.ADMIN)
  async grantTokens(@Param('userId') userId: string, @Body() dto: GrantTokensDto) {
    const result = await this.billingService.creditTokens(
      userId,
      dto.tokens,
      dto.amountUsd ?? 0,
      null,
      dto.note ?? 'Admin tarafından tanımlandı',
    );
    return {
      success: true,
      message: `${dto.tokens.toLocaleString('tr-TR')} token tanımlandı.`,
      data: result,
    };
  }
}
