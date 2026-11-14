import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { Workspace } from '../entities/workspace.entity';
import { Post } from '../entities/post.entity';
import { ApiKey } from '../entities/api-key.entity';
import { Webhook } from '../entities/webhook.entity';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { PlanDefinition } from '../entities/plan-definition.entity';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workspace,
      Post,
      ApiKey,
      Webhook,
      Organization,
      Project,
      PlanDefinition,
      Subscription,
    ]),
    forwardRef(() => AuthModule), // Import AuthModule to get ApiKeyRotationService
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
