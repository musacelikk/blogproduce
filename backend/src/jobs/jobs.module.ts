import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { GenerationJob } from '../entities/generation-job.entity';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { ApiKey } from '../entities/api-key.entity';
import { User } from '../entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GenerationJob, Organization, Project, ApiKey, User]),
    AuthModule,
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
