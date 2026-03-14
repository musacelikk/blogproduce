import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsageService } from '../usage/usage.service';
import { UsageLedger } from '../entities/usage-ledger.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { PostRevision } from '../entities/post-revision.entity';
import { Workspace } from '../entities/workspace.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { PlanDefinition } from '../entities/plan-definition.entity';
import { Subscription } from '../entities/subscription.entity';
import { Payment } from '../entities/payment.entity';
import { EventTracking } from '../entities/event-tracking.entity';
import { UserBehavior } from '../entities/user-behavior.entity';
import { Webhook } from '../entities/webhook.entity';
import { Settings } from '../entities/settings.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsageLedger, User, Post, PostRevision, Workspace, ActivityLog, PlanDefinition, Subscription, Payment, EventTracking, UserBehavior, Webhook, Settings]),
    CommonModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, UsageService],
  exports: [AdminService],
})
export class AdminModule {}

