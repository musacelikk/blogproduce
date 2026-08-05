import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenerationJob, JobStatus } from '../entities/generation-job.entity';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(GenerationJob)
    private generationJobRepository: Repository<GenerationJob>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  /**
   * Get a job by id, authorizing the caller directly rather than reconstructing
   * their tenant. A user may own several organizations (one per workspace), so
   * resolving "the user's organization" first would 404 on perfectly valid jobs.
   */
  async getJobForUser(jobId: string, user: User): Promise<GenerationJob | null> {
    const job = await this.generationJobRepository.findOne({
      where: { id: jobId },
      relations: ['post', 'organization'],
    });

    if (!job || job.organization?.ownerId !== user.id) {
      return null;
    }

    return job;
  }

  /**
   * Get job by ID with explicit tenant validation (API-key callers, where the
   * organization and project come from the key itself).
   */
  async getJob(jobId: string, organizationId: string, projectId: string): Promise<GenerationJob | null> {
    return this.generationJobRepository.findOne({
      where: {
        id: jobId,
        organizationId,
        projectId,
      },
      relations: ['post'],
    });
  }
}
