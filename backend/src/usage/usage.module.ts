import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsageService } from './usage.service';
import { UsageController } from './usage.controller';
import { UsageLedger } from '../entities/usage-ledger.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { PostRevision } from '../entities/post-revision.entity';
import { Workspace } from '../entities/workspace.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UsageLedger, User, Post, PostRevision, Workspace])],
  controllers: [UsageController],
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}

