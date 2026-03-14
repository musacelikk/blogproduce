import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { ApiKey } from '../entities/api-key.entity';
import { ApiKeySecret } from '../entities/api-key-secret.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, Project, ApiKey, ApiKeySecret]),
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}

