import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from '../entities/site.entity';
import { Workspace } from '../entities/workspace.entity';
import { User } from '../entities/user.entity';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';

@Injectable()
export class SitesService {
  constructor(
    @InjectRepository(Site)
    private sitesRepository: Repository<Site>,
    @InjectRepository(Workspace)
    private workspacesRepository: Repository<Workspace>,
  ) {}

  async create(user: User, createSiteDto: CreateSiteDto) {
    const workspace = await this.workspacesRepository.findOne({
      where: { id: createSiteDto.workspaceId, ownerId: user.id },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const site = this.sitesRepository.create({
      ...createSiteDto,
      workspaceId: workspace.id,
    });
    return this.sitesRepository.save(site);
  }

  async findAll(user: User, workspaceId?: string) {
    if (workspaceId) {
      const workspace = await this.workspacesRepository.findOne({
        where: { id: workspaceId, ownerId: user.id },
      });
      if (!workspace) {
        throw new NotFoundException('Workspace not found');
      }
      return this.sitesRepository.find({
        where: { workspaceId },
        relations: ['workspace'],
      });
    }

    // Without an explicit workspace, return only the caller's own sites —
    // an unscoped find() would return every tenant's sites.
    return this.sitesRepository.find({
      where: { workspace: { ownerId: user.id } },
      relations: ['workspace'],
    });
  }

  async findOne(id: string, user: User) {
    const site = await this.sitesRepository.findOne({
      where: { id },
      relations: ['workspace'],
    });

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    if (site.workspace.ownerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    return site;
  }

  async update(id: string, user: User, updateSiteDto: UpdateSiteDto) {
    const site = await this.findOne(id, user);
    Object.assign(site, updateSiteDto);
    return this.sitesRepository.save(site);
  }

  async remove(id: string, user: User) {
    const site = await this.findOne(id, user);
    await this.sitesRepository.remove(site);
    return { message: 'Site deleted successfully' };
  }
}
