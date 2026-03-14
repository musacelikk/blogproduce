import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanDefinition } from '../entities/plan-definition.entity';
import { Subscription, SubscriptionStatus, BillingPeriod } from '../entities/subscription.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(PlanDefinition)
    private planRepository: Repository<PlanDefinition>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getAvailablePlans() {
    return this.planRepository.find({
      where: { active: true },
      order: { createdAt: 'ASC' },
    });
  }

  async getUserPlanInfo(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['workspaces'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get active subscription
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['plan'],
      order: { startedAt: 'DESC' },
    });

    const now = new Date();

    // Abonelik yok, planId yok → ücretsiz
    if (!subscription && !user.planId) {
      return {
        currentPlan: null,
        subscription: null,
        isFree: true,
      };
    }

    // Aktif abonelik var → kalan süre hesapla (ödeme/satın alma ile güncellenir)
    if (subscription) {
      const isExpired = subscription.expiresAt && subscription.expiresAt < now;
      const daysRemaining = subscription.expiresAt
        ? Math.max(0, Math.ceil((subscription.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : null;

      return {
        currentPlan: subscription.plan,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          billingPeriod: subscription.billingPeriod,
          startedAt: subscription.startedAt,
          expiresAt: subscription.expiresAt,
          cancelledAt: subscription.cancelledAt,
          autoRenew: subscription.autoRenew,
          isExpired,
          daysRemaining,
        },
        isFree: false,
      };
    }

    // planId var ama abonelik yok (manuel atama veya ücretsiz plan referansı)
    if (user.planId) {
      const plan = await this.planRepository.findOne({
        where: { id: user.planId },
      });
      const isFreePlan = !plan || (plan.level === 'starter' && plan.price?.monthly === 0 && plan.price?.yearly === 0);

      return {
        currentPlan: plan,
        subscription: null,
        isFree: isFreePlan,
      };
    }

    return {
      currentPlan: null,
      subscription: null,
      isFree: true,
    };
  }

  async getUserBillingHistory(userId: string) {
    const subscriptions = await this.subscriptionRepository.find({
      where: { userId },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
      take: 50, // Last 50 billing records
    });

    return subscriptions.map((sub) => ({
      id: sub.id,
      plan: sub.plan,
      status: sub.status,
      billingPeriod: sub.billingPeriod,
      startedAt: sub.startedAt,
      expiresAt: sub.expiresAt,
      cancelledAt: sub.cancelledAt,
      autoRenew: sub.autoRenew,
      createdAt: sub.createdAt,
    }));
  }
}

