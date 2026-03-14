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
   * Get job by ID with tenant validation
   */
  async getJob(jobId: string, organizationId: string, projectId: string): Promise<GenerationJob | null> {
    const job = await this.generationJobRepository.findOne({
      where: {
        id: jobId,
        organizationId,
        projectId,
      },
      relations: ['post'],
    });

    return job;
  }

  /**
   * Get user's organization and project
   */
  async getUserOrganizationAndProject(user: User): Promise<{ organization: Organization; project: Project }> {
    let organization = await this.organizationRepository.findOne({
      where: { ownerId: user.id },
    });

    if (!organization) {
      organization = this.organizationRepository.create({
        name: `${user.name || user.email}'s Organization`,
        ownerId: user.id,
      });
      organization = await this.organizationRepository.save(organization);
    }

    // Get user's first project or create default
    let project = await this.projectRepository.findOne({
      where: { organizationId: organization.id },
      order: { createdAt: 'ASC' },
    });

    if (!project) {
      project = this.projectRepository.create({
        organizationId: organization.id,
        name: 'Default Project',
        slug: 'default-project',
        description: 'Default project for user generated content',
      });
      project = await this.projectRepository.save(project);
    }

    return { organization, project };
  }
}
