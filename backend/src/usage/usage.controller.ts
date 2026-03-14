import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { UsageService } from './usage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '../entities/user.entity';

@Controller('usage')
@UseGuards(JwtAuthGuard)
export class UsageController {
  constructor(private usageService: UsageService) {}

  @Get('current')
  async getCurrentUsage(@CurrentUser() user: User) {
    const usage = await this.usageService.getCurrentMonthUsage(user.id);
    return {
      success: true,
      data: usage || {
        userId: user.id,
        month: new Date().toISOString().slice(0, 7),
        estimatedCostUsd: 0,
        tokensIn: 0,
        tokensOut: 0,
        requestCount: 0,
      },
    };
  }

  @Get('history')
  async getUserHistory(@CurrentUser() user: User) {
    const history = await this.usageService.getUserUsageHistory(user.id);
    return {
      success: true,
      data: history,
    };
  }

  @Get('workspaces')
  async getWorkspaceUsage(@CurrentUser() user: User, @Query('month') month?: string) {
    const workspaceUsage = await this.usageService.getWorkspaceUsage(user.id, month);
    return {
      success: true,
      data: workspaceUsage,
    };
  }
}

