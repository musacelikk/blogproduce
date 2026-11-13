import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { CurrentProject } from '../auth/decorators/project.decorator';
import { CurrentOrganization } from '../auth/decorators/organization.decorator';
import { Project } from '../entities/project.entity';
import { Organization } from '../entities/organization.entity';
import { AutopilotService } from './autopilot.service';
import { UpsertAutopilotConfigDto } from './dto/upsert-autopilot-config.dto';
import { CreateSiteApiDto } from './dto/create-site-api.dto';

/**
 * Autopilot over the partner API.
 *
 * The dashboard controller (`AutopilotController`) authorizes a JWT user against
 * the site's workspace owner; this one authorizes an API key against the project
 * its key is scoped to. Same service, two principals — see
 * `assertSiteInProject`, which is what stops one customer's key reaching
 * another's configuration.
 *
 * Paths avoid the `resource:action` form used by `posts:generate`: Express
 * parses that as a literal segment plus a param, which needs a guard against
 * typo'd URLs. Plain nested paths need no such trick.
 */
@Controller('api/v1')
@UseGuards(ApiKeyGuard)
export class AutopilotApiController {
  constructor(private readonly autopilot: AutopilotService) {}

  /** Sites this key may drive — the ids every route below needs. */
  @Get('sites')
  async listSites(
    @CurrentProject() project: Project,
    @CurrentOrganization() organization: Organization,
  ) {
    const sites = await this.autopilot.listSitesForProject(project, organization);
    return { success: true, data: sites };
  }

  @Post('sites')
  async createSite(
    @CurrentProject() project: Project,
    @CurrentOrganization() organization: Organization,
    @Body() dto: CreateSiteApiDto,
  ) {
    const site = await this.autopilot.createSiteForProject(project, organization, dto);
    return { success: true, data: site };
  }

  /** null when autopilot has never been configured for this site. */
  @Get('sites/:siteId/autopilot')
  async getConfig(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentProject() project: Project,
    @CurrentOrganization() organization: Organization,
  ) {
    const config = await this.autopilot.getConfigForProject(siteId, project, organization);
    return { success: true, data: config };
  }

  /**
   * Partial update — only the fields present are applied, so a caller can flip
   * `enabled` without resending the whole configuration.
   */
  @Put('sites/:siteId/autopilot')
  async upsertConfig(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentProject() project: Project,
    @CurrentOrganization() organization: Organization,
    @Body() dto: UpsertAutopilotConfigDto,
  ) {
    const config = await this.autopilot.upsertConfigForProject(siteId, project, organization, dto);
    return { success: true, data: config };
  }

  @Get('sites/:siteId/autopilot/topics')
  async listTopics(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentProject() project: Project,
    @CurrentOrganization() organization: Organization,
  ) {
    const topics = await this.autopilot.listTopicsForProject(siteId, project, organization);
    return { success: true, data: topics };
  }

  /** Plan a batch now instead of waiting for a run to notice the queue is low. */
  @Post('sites/:siteId/autopilot/topics/plan')
  async planTopics(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentProject() project: Project,
    @CurrentOrganization() organization: Organization,
  ) {
    const result = await this.autopilot.planTopicsNowForProject(siteId, project, organization);
    return { success: true, data: result };
  }
}
