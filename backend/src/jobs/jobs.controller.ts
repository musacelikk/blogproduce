import { Controller, Get, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { ApiKeyOrJwtGuard } from '../auth/guards/api-key-or-jwt.guard';
import { CurrentOrganization } from '../auth/decorators/organization.decorator';
import { CurrentProject } from '../auth/decorators/project.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { User } from '../entities/user.entity';

/**
 * Jobs Controller
 * Handles job status queries
 */
@Controller('jobs')
@UseGuards(ApiKeyOrJwtGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  /**
   * Get job status by jobId
   * Returns job status and postId when completed
   */
  @Get(':jobId')
  async getJob(
    @Param('jobId') jobId: string,
    @CurrentOrganization() organization: Organization | undefined,
    @CurrentProject() project: Project | undefined,
    @CurrentUser() user: User | undefined,
  ) {
    // API-key callers carry their tenant on the request; JWT callers are authorized
    // against the job's owning organization instead (a user can own several).
    const job =
      organization && project
        ? await this.jobsService.getJob(jobId, organization.id, project.id)
        : user
          ? await this.jobsService.getJobForUser(jobId, user)
          : null;

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return {
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        postId: job.postId,
        error: job.error,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        processingTimeMs: job.processingTimeMs,
      },
    };
  }
}
