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
import { GrantTokensDto } from './dto/grant-tokens.dto';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { ReviewPaymentDto } from './dto/review-payment.dto';

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

  // ── Bank transfer (havale / EFT) ──────────────────────────────────────

  /** IBAN and instructions shown on the payment screen. */
  @Get('bank-details')
  getBankDetails() {
    return { success: true, data: this.billingService.getBankDetails() };
  }

  /**
   * Open an order for a plan or a token pack and return the reference code.
   * Grants nothing — fulfilment waits for an admin to match the bank statement.
   */
  @Post('payment-requests')
  async createPaymentRequest(@CurrentUser() user: User, @Body() dto: CreatePaymentRequestDto) {
    const payment = await this.billingService.createPaymentRequest(user.id, {
      type: dto.type,
      planKey: dto.planKey,
      packId: dto.packId,
      yearly: dto.yearly,
    });

    return {
      success: true,
      message:
        'Ödeme talebiniz oluşturuldu. Havale açıklamasına referans kodunu yazmayı unutmayın.',
      data: {
        payment,
        bank: this.billingService.getBankDetails(),
      },
    };
  }

  @Get('payment-requests')
  async getMyPayments(@CurrentUser() user: User) {
    return { success: true, data: await this.billingService.listMyPayments(user.id) };
  }

  @Post('payment-requests/:id/cancel')
  async cancelPaymentRequest(@CurrentUser() user: User, @Param('id') id: string) {
    await this.billingService.cancelPaymentRequest(user.id, id);
    return { success: true, message: 'Ödeme talebi iptal edildi.' };
  }

  // ── Admin: bank transfer inbox ────────────────────────────────────────

  @Get('admin/payment-requests')
  @Roles(UserRole.ADMIN)
  async getPendingPayments() {
    return { success: true, data: await this.billingService.listPendingPayments() };
  }

  /** Money arrived — activate the plan or credit the tokens. */
  @Post('admin/payment-requests/:id/confirm')
  @Roles(UserRole.ADMIN)
  async confirmPayment(
    @CurrentUser() admin: User,
    @Param('id') id: string,
    @Body() dto: ReviewPaymentDto,
  ) {
    const payment = await this.billingService.confirmPayment(id, admin.id, dto.note);
    return { success: true, message: 'Ödeme onaylandı ve tanımlandı.', data: payment };
  }

  @Post('admin/payment-requests/:id/reject')
  @Roles(UserRole.ADMIN)
  async rejectPayment(
    @CurrentUser() admin: User,
    @Param('id') id: string,
    @Body() dto: ReviewPaymentDto,
  ) {
    await this.billingService.rejectPayment(id, admin.id, dto.note);
    return { success: true, message: 'Ödeme reddedildi.' };
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
      dto.amountTry ?? 0,
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
