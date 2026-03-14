import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '../entities/user.entity';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get('available')
  async getAvailablePlans() {
    const plans = await this.plansService.getAvailablePlans();
    return {
      success: true,
      data: plans,
    };
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  async getCurrentPlan(@CurrentUser() user: User) {
    const planInfo = await this.plansService.getUserPlanInfo(user.id);
    return {
      success: true,
      data: planInfo,
    };
  }

  @Get('billing')
  @UseGuards(JwtAuthGuard)
  async getBillingHistory(@CurrentUser() user: User) {
    const history = await this.plansService.getUserBillingHistory(user.id);
    return {
      success: true,
      data: history,
    };
  }
}

