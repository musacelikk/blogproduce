import { Controller, Get, Post, Put, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '../entities/user.entity';
import { AutopilotService } from './autopilot.service';
import { UpsertAutopilotConfigDto } from './dto/upsert-autopilot-config.dto';
import { TIER_DEFINITIONS, ModelTier, averageArticleCostUsd } from '../billing/model-tiers';

@Controller('autopilot')
@UseGuards(JwtAuthGuard)
export class AutopilotController {
  constructor(private readonly autopilot: AutopilotService) {}

  /**
   * Tier options with their projected per-article provider cost, so the
   * dashboard can show what a cadence will actually cost before it is enabled.
   */
  @Get('tiers')
  async tiers() {
    return {
      success: true,
      data: Object.values(ModelTier).map((tier) => ({
        tier,
        label: TIER_DEFINITIONS[tier].label,
        description: TIER_DEFINITIONS[tier].description,
        estimatedCostPerArticleUsd: Number(averageArticleCostUsd(tier).toFixed(4)),
      })),
    };
  }

  @Get('sites/:siteId')
  async getConfig(@Param('siteId', ParseUUIDPipe) siteId: string, @CurrentUser() user: User) {
    const config = await this.autopilot.getConfig(siteId, user);
    return { success: true, data: config };
  }

  @Put('sites/:siteId')
  async upsertConfig(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentUser() user: User,
    @Body() dto: UpsertAutopilotConfigDto,
  ) {
    const config = await this.autopilot.upsertConfig(siteId, user, dto);
    return { success: true, data: config };
  }

  @Get('sites/:siteId/topics')
  async listTopics(@Param('siteId', ParseUUIDPipe) siteId: string, @CurrentUser() user: User) {
    const topics = await this.autopilot.listTopics(siteId, user);
    return { success: true, data: topics };
  }

  /** Plan a fresh batch now instead of waiting for the queue to run low. */
  @Post('sites/:siteId/topics/plan')
  async planTopics(@Param('siteId', ParseUUIDPipe) siteId: string, @CurrentUser() user: User) {
    const result = await this.autopilot.planTopicsNow(siteId, user);
    return { success: true, data: result };
  }

  @Post('topics/:topicId/reject')
  async rejectTopic(@Param('topicId', ParseUUIDPipe) topicId: string, @CurrentUser() user: User) {
    await this.autopilot.rejectTopic(topicId, user);
    return { success: true, data: { rejected: true } };
  }
}
