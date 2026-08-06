import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingService } from './billing.service';
import { CostAnalysisService } from './cost-analysis.service';
import { BillingController } from './billing.controller';
import { User } from '../entities/user.entity';
import { PlanDefinition } from '../entities/plan-definition.entity';
import { Subscription } from '../entities/subscription.entity';
import { UsageLedger } from '../entities/usage-ledger.entity';
import { PostRevision } from '../entities/post-revision.entity';
import { TokenPack } from '../entities/token-pack.entity';
import { TokenPurchase } from '../entities/token-purchase.entity';
import { Payment } from '../entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      PlanDefinition,
      Subscription,
      UsageLedger,
      PostRevision,
      TokenPack,
      TokenPurchase,
      Payment,
    ]),
  ],
  controllers: [BillingController],
  providers: [BillingService, CostAnalysisService],
  exports: [BillingService, CostAnalysisService],
})
export class BillingModule {}
