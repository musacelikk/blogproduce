import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';
import { Post, PostStatus } from '../entities/post.entity';
import { Workspace } from '../entities/workspace.entity';
import { UsageLedger } from '../entities/usage-ledger.entity';
import { ActivityLog, ActivityType, ActivitySeverity } from '../entities/activity-log.entity';
import { PlanDefinition, PlanLevel } from '../entities/plan-definition.entity';
import { Subscription, SubscriptionStatus, BillingPeriod } from '../entities/subscription.entity';
import { Payment, PaymentStatus, PaymentMethod } from '../entities/payment.entity';
import { EventTracking, EventType } from '../entities/event-tracking.entity';
import { UserBehavior, BehaviorType } from '../entities/user-behavior.entity';
import { PostRevision } from '../entities/post-revision.entity';
import { Webhook } from '../entities/webhook.entity';
import { Settings } from '../entities/settings.entity';
import { MoreThan, LessThan, In } from 'typeorm';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Workspace)
    private workspacesRepository: Repository<Workspace>,
    @InjectRepository(UsageLedger)
    private usageLedgerRepository: Repository<UsageLedger>,
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(PlanDefinition)
    private planDefinitionsRepository: Repository<PlanDefinition>,
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(EventTracking)
    private eventTrackingRepository: Repository<EventTracking>,
    @InjectRepository(UserBehavior)
    private userBehaviorRepository: Repository<UserBehavior>,
    @InjectRepository(PostRevision)
    private postRevisionRepository: Repository<PostRevision>,
    @InjectRepository(Webhook)
    private webhookRepository: Repository<Webhook>,
    @InjectRepository(Settings)
    private settingsRepository: Repository<Settings>,
  ) {}

  async getAllUsers() {
    const users = await this.usersRepository.find({
      relations: ['workspaces'],
      order: { createdAt: 'DESC' },
    });

    // Get blog counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const blogsCount = await this.postsRepository.count({
          where: { authorId: user.id },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
          createdAt: user.createdAt,
          blogsCount,
          status: 'active', // You can add status field to User entity if needed
        };
      }),
    );

    return usersWithStats;
  }

  async getUserById(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['workspaces'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const blogsCount = await this.postsRepository.count({
      where: { authorId: user.id },
    });

    return {
      ...user,
      blogsCount,
    };
  }

  async updateUserRole(id: string, role: 'user' | 'admin') {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = role === 'user' ? UserRole.USER : UserRole.ADMIN;
    await this.usersRepository.save(user);

    return user;
  }

  async updateUser(id: string, updateData: { name?: string; email?: string; role?: 'user' | 'admin'; password?: string }) {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateData.name) {
      user.name = updateData.name;
    }

    if (updateData.email) {
      // Check if email is already taken by another user
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateData.email },
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already in use');
      }
      user.email = updateData.email;
    }

    if (updateData.role) {
      user.role = updateData.role === 'user' ? UserRole.USER : UserRole.ADMIN;
    }

    // Hash password if provided - ALWAYS hash passwords before saving
    if (updateData.password) {
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      user.password = hashedPassword;
    }

    await this.usersRepository.save(user);

    const blogsCount = await this.postsRepository.count({
      where: { authorId: user.id },
    });

    // Don't return password in response
    const { password, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      blogsCount,
    };
  }

  async deleteUser(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.remove(user);
    return { success: true };
  }

  async getAllPosts(filters?: {
    status?: string;
    authorId?: string;
    workspaceId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.postsRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.workspace', 'workspace')
      .leftJoinAndSelect('workspace.owner', 'workspaceOwner')
      .leftJoinAndSelect('post.revisions', 'revisions')
      .leftJoinAndSelect('post.seo', 'seo')
      .leftJoinAndSelect('post.tags', 'tags')
      .leftJoinAndSelect('post.coverImage', 'coverImage')
      .orderBy('post.createdAt', 'DESC')
      .addOrderBy('revisions.createdAt', 'DESC');

    // Admin panelinde tüm blogları göster (gizlenmiş olanlar dahil)
    // Status filter varsa uygula, yoksa tüm status'leri göster
    if (filters?.status) {
      query.andWhere('post.status = :status', { status: filters.status });
    }

    if (filters?.authorId) {
      query.andWhere('post.authorId = :authorId', { authorId: filters.authorId });
    }

    if (filters?.workspaceId) {
      query.andWhere('post.workspaceId = :workspaceId', { workspaceId: filters.workspaceId });
    }

    // Get total count for pagination
    const total = await query.getCount();

    // Apply pagination
    query.skip(skip).take(limit);

    const data = await query.getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPostById(id: string) {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: [
        'author',
        'workspace',
        'workspace.owner',
        'revisions',
        'seo',
        'tags',
        'coverImage',
        'postAssets',
        'postAssets.asset',
      ],
      order: {
        revisions: {
          createdAt: 'DESC',
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async hidePost(id: string, reason?: string) {
    const post = await this.postsRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Eğer yayındaysa taslağa al
    if (post.status === PostStatus.PUBLISHED) {
      post.status = PostStatus.DRAFT;
      post.publishedAt = null as any;
    }

    post.hiddenByAdmin = true;
    post.hiddenAt = new Date();
    post.hiddenReason = reason || null;

    return this.postsRepository.save(post);
  }

  async unhidePost(id: string) {
    const post = await this.postsRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.hiddenByAdmin = false;
    post.hiddenAt = null;
    post.hiddenReason = null;

    return this.postsRepository.save(post);
  }

  async getAllWorkspaces(filters?: {
    ownerId?: string;
  }) {
    const query = this.workspacesRepository.createQueryBuilder('workspace')
      .leftJoinAndSelect('workspace.owner', 'owner')
      .leftJoinAndSelect('workspace.sites', 'sites')
      .orderBy('workspace.createdAt', 'DESC');

    if (filters?.ownerId) {
      query.andWhere('workspace.ownerId = :ownerId', { ownerId: filters.ownerId });
    }

    const workspaces = await query.getMany();

    // Get post counts for each workspace
    const workspacesWithStats = await Promise.all(
      workspaces.map(async (workspace) => {
        const postsCount = await this.postsRepository.count({
          where: { workspaceId: workspace.id },
        });

        return {
          ...workspace,
          postsCount,
        };
      }),
    );

    return workspacesWithStats;
  }

  async getWorkspaceById(id: string) {
    const workspace = await this.workspacesRepository.findOne({
      where: { id },
      relations: ['owner', 'sites'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const postsCount = await this.postsRepository.count({
      where: { workspaceId: workspace.id },
    });

    const posts = await this.postsRepository.find({
      where: { workspaceId: workspace.id },
      relations: ['author', 'revisions', 'seo', 'tags'],
      order: { createdAt: 'DESC' },
      take: 10, // Get latest 10 posts
    });

    return {
      ...workspace,
      postsCount,
      recentPosts: posts,
    };
  }

  async getDashboardStats() {
    const totalUsers = await this.usersRepository.count();
    const totalPosts = await this.postsRepository.count();
    const activeUsers = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.createdAt > :date', { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) })
      .getCount();

    const postsThisMonth = await this.postsRepository
      .createQueryBuilder('post')
      .where('post.createdAt > :date', { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) })
      .getCount();

    const totalUsage = await this.usageLedgerRepository
      .createQueryBuilder('usage')
      .select('SUM(usage.tokensIn + usage.tokensOut)', 'total')
      .getRawOne();

    return {
      totalUsers,
      totalPosts,
      activeUsers,
      postsThisMonth,
      totalTokens: Number(totalUsage?.total || 0),
    };
  }

  async getActivityLogs(filters?: {
    type?: ActivityType;
    severity?: ActivitySeverity;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const query = this.activityLogRepository.createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC');

    if (filters?.type) {
      query.andWhere('log.type = :type', { type: filters.type });
    }

    if (filters?.severity) {
      query.andWhere('log.severity = :severity', { severity: filters.severity });
    }

    if (filters?.userId) {
      query.andWhere('log.userId = :userId', { userId: filters.userId });
    }

    if (filters?.startDate) {
      query.andWhere('log.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('log.createdAt <= :endDate', { endDate: filters.endDate });
    }

    if (filters?.limit) {
      query.limit(filters.limit);
    } else {
      query.limit(100); // Default limit
    }

    return query.getMany();
  }

  // Plan Definitions Management
  async getAllPlans() {
    return this.planDefinitionsRepository.find({
      order: { createdAt: 'ASC' },
    });
  }

  async getPlanById(id: string) {
    const plan = await this.planDefinitionsRepository.findOne({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  async createPlan(planData: {
    name: string;
    level: PlanLevel;
    price: { monthly: number; yearly: number };
    features: {
      maxBlogs: number | 'unlimited';
      maxTokensPerMonth: number | 'unlimited';
      maxWorkspaces: number | 'unlimited';
      languages: string[];
      support: string;
      apiAccess: boolean;
      customTraining: boolean;
      accountManager: boolean;
      prioritySupport: boolean;
      webhookAccess: boolean;
      customBranding: boolean;
      advancedSeo: boolean;
      analytics: boolean;
    };
    popular?: boolean;
    active?: boolean;
    description?: string;
  }) {
    const plan = this.planDefinitionsRepository.create(planData);
    return this.planDefinitionsRepository.save(plan);
  }

  async updatePlan(id: string, updateData: Partial<PlanDefinition>) {
    const plan = await this.planDefinitionsRepository.findOne({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    Object.assign(plan, updateData);
    return this.planDefinitionsRepository.save(plan);
  }

  async deletePlan(id: string) {
    const plan = await this.planDefinitionsRepository.findOne({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Check if any users are using this plan
    const usersWithPlan = await this.usersRepository.count({
      where: { planId: id },
    });

    if (usersWithPlan > 0) {
      throw new ConflictException(
        `Cannot delete plan. ${usersWithPlan} user(s) are currently using this plan.`,
      );
    }

    await this.planDefinitionsRepository.remove(plan);
    return { success: true };
  }

  async updateUserPlan(userId: string, planId: string | null) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (planId) {
      const plan = await this.planDefinitionsRepository.findOne({
        where: { id: planId },
      });

      if (!plan) {
        throw new NotFoundException('Plan not found');
      }

      if (!plan.active) {
        throw new ConflictException('Cannot assign inactive plan to user');
      }
    }

    user.planId = planId ?? null;
    await this.usersRepository.save(user);

    const blogsCount = await this.postsRepository.count({
      where: { authorId: user.id },
    });

    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      blogsCount,
    };
  }

  async getAllSubscriptions(filters?: {
    status?: SubscriptionStatus;
    userId?: string;
  }) {
    const query = this.subscriptionsRepository.createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.user', 'user')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .orderBy('subscription.createdAt', 'DESC');

    if (filters?.status) {
      query.andWhere('subscription.status = :status', { status: filters.status });
    }

    if (filters?.userId) {
      query.andWhere('subscription.userId = :userId', { userId: filters.userId });
    }

    return query.getMany();
  }

  /**
   * Satın alma kaydı: ödeme ekler ve aboneliği oluşturur/uzatır.
   * Ödeme yöntemi entegre edilmeden manuel veya harici sistemden çağrılabilir.
   */
  async recordPurchase(params: {
    userId: string;
    planId: string;
    billingPeriod: BillingPeriod;
    amount?: number;
    paymentMethod?: PaymentMethod;
    transactionId?: string;
    notes?: string;
  }) {
    const { userId, planId, billingPeriod, amount = 0, paymentMethod = PaymentMethod.OTHER, transactionId, notes } = params;

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const plan = await this.planDefinitionsRepository.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException('Plan bulunamadı');
    }
    if (!plan.active) {
      throw new BadRequestException('Plan aktif değil');
    }

    const now = new Date();
    const addMonths = (date: Date, months: number) => {
      const d = new Date(date);
      d.setMonth(d.getMonth() + months);
      return d;
    };
    const expiresAt = billingPeriod === BillingPeriod.YEARLY ? addMonths(now, 12) : addMonths(now, 1);

    let subscription = await this.subscriptionsRepository.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
      order: { startedAt: 'DESC' },
    });

    if (subscription && subscription.planId === planId) {
      // Aynı plan: mevcut aboneliği uzat (expiresAt'ı yeni süre kadar ileri al)
      const currentEnd = subscription.expiresAt && subscription.expiresAt > now ? subscription.expiresAt : now;
      subscription.expiresAt = billingPeriod === BillingPeriod.YEARLY ? addMonths(currentEnd, 12) : addMonths(currentEnd, 1);
      await this.subscriptionsRepository.save(subscription);
    } else {
      // Eski aktif aboneliği kapat
      if (subscription) {
        subscription.status = SubscriptionStatus.EXPIRED;
        subscription.cancelledAt = now;
        await this.subscriptionsRepository.save(subscription);
      }
      // Yeni abonelik oluştur
      subscription = this.subscriptionsRepository.create({
        userId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        billingPeriod,
        startedAt: now,
        expiresAt,
        cancelledAt: null,
        autoRenew: false,
      });
      await this.subscriptionsRepository.save(subscription);
    }

    const payment = this.paymentsRepository.create({
      userId,
      subscriptionId: subscription.id,
      planId,
      amount: Number(amount),
      currency: 'USD',
      status: PaymentStatus.COMPLETED,
      paymentMethod,
      transactionId: transactionId ?? null,
      externalId: transactionId ?? null,
      notes: notes ?? null,
      paidAt: now,
    });
    await this.paymentsRepository.save(payment);

    user.planId = planId;
    await this.usersRepository.save(user);

    return {
      subscription: await this.subscriptionsRepository.findOne({
        where: { id: subscription.id },
        relations: ['plan', 'user'],
      }),
      payment,
    };
  }

  async getAllPayments(filters?: {
    status?: PaymentStatus;
    userId?: string;
    subscriptionId?: string;
  }) {
    const query = this.paymentsRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user', 'user')
      .leftJoinAndSelect('payment.subscription', 'subscription')
      .leftJoinAndSelect('payment.plan', 'plan')
      .orderBy('payment.createdAt', 'DESC');

    if (filters?.status) {
      query.andWhere('payment.status = :status', { status: filters.status });
    }

    if (filters?.userId) {
      query.andWhere('payment.userId = :userId', { userId: filters.userId });
    }

    if (filters?.subscriptionId) {
      query.andWhere('payment.subscriptionId = :subscriptionId', { subscriptionId: filters.subscriptionId });
    }

    return query.getMany();
  }

  async getSalesStats(month?: string) {
    const query = this.paymentsRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user', 'user')
      .leftJoinAndSelect('payment.plan', 'plan')
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED });

    if (month) {
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);
      query.andWhere('payment.createdAt >= :startDate', { startDate })
        .andWhere('payment.createdAt <= :endDate', { endDate });
    }

    const payments = await query.getMany();

    const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const totalPayments = payments.length;
    const uniqueCustomers = new Set(payments.map(p => p.userId)).size;

    // Plan bazlı satışlar
    const planSales = new Map<string, { planName: string; count: number; revenue: number }>();
    payments.forEach(payment => {
      if (payment.plan) {
        const planId = payment.plan.id;
        const planName = payment.plan.name;
        if (!planSales.has(planId)) {
          planSales.set(planId, { planName, count: 0, revenue: 0 });
        }
        const sales = planSales.get(planId)!;
        sales.count += 1;
        sales.revenue += Number(payment.amount);
      }
    });

    return {
      totalRevenue,
      totalPayments,
      uniqueCustomers,
      averageOrderValue: totalPayments > 0 ? totalRevenue / totalPayments : 0,
      planSales: Array.from(planSales.values()),
      payments: payments.slice(0, 100), // Son 100 ödeme
    };
  }

  // Homepage Posts Management
  // Database'de Settings tablosunda saklanıyor
  private readonly HOMEPAGE_POSTS_KEY = 'homepage_posts';

  async getHomepagePosts(): Promise<string[]> {
    try {
      this.logger.log(`Getting homepage posts from database (key: ${this.HOMEPAGE_POSTS_KEY})`);
      
      const setting = await this.settingsRepository.findOne({
        where: { key: this.HOMEPAGE_POSTS_KEY },
      });

      if (!setting) {
        this.logger.log('Homepage posts setting not found in database, returning empty array');
        return [];
      }

      if (!setting.value) {
        this.logger.log('Homepage posts setting found but value is empty, returning empty array');
        return [];
      }

      try {
        const parsed = JSON.parse(setting.value);
        if (Array.isArray(parsed)) {
          const postIds = parsed.map((id: unknown) => String(id));
          this.logger.log(`Homepage posts loaded from database: ${postIds.length} posts`, postIds);
          return postIds;
        } else {
          this.logger.warn('Homepage posts setting value is not an array:', setting.value);
          return [];
        }
      } catch (parseError) {
        this.logger.error(`Error parsing homepage posts: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`, parseError instanceof Error ? parseError.stack : undefined);
        this.logger.error(`Raw setting value: ${setting.value}`);
        return [];
      }
    } catch (error) {
      this.logger.error(`Error reading homepage posts: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      return [];
    }
  }

  async setHomepagePosts(postIds: string[]): Promise<void> {
    const normalized = postIds.map((id) => String(id)).filter(Boolean);
    try {
      this.logger.log(`Setting homepage posts: ${normalized.length} posts`, normalized);

      if (normalized.length > 0) {
        const posts = await this.postsRepository.find({
          where: { id: In(normalized) },
        });
        const foundIds = new Set(posts.map((p) => String(p.id)));
        const missing = normalized.filter((id) => !foundIds.has(id));
        if (missing.length > 0) {
          this.logger.warn(`Some post IDs are invalid or not found: ${missing.join(', ')}`);
          throw new BadRequestException(`Geçersiz veya bulunamayan blog ID'leri: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`);
        }
        this.logger.log(`Validated ${normalized.length} post IDs`);
      }

      const jsonData = JSON.stringify(normalized);
      const existingSetting = await this.settingsRepository.findOne({
        where: { key: this.HOMEPAGE_POSTS_KEY },
      });

      if (existingSetting) {
        existingSetting.value = jsonData;
        await this.settingsRepository.save(existingSetting);
        this.logger.log(`Homepage posts updated: ${normalized.length} posts`);
      } else {
        const newSetting = this.settingsRepository.create({
          key: this.HOMEPAGE_POSTS_KEY,
          value: jsonData,
        });
        await this.settingsRepository.save(newSetting);
        this.logger.log(`Homepage posts created: ${normalized.length} posts`);
      }

      const verifySetting = await this.settingsRepository.findOne({
        where: { key: this.HOMEPAGE_POSTS_KEY },
      });
      if (!verifySetting?.value) {
        this.logger.error('Homepage posts setting was not saved correctly');
        throw new BadRequestException('Kayıt doğrulanamadı. Lütfen tekrar deneyin.');
      }
      const verifyParsed = JSON.parse(verifySetting.value);
      if (!Array.isArray(verifyParsed) || verifyParsed.length !== normalized.length) {
        this.logger.error(`Verify mismatch: expected ${normalized.length}, got ${Array.isArray(verifyParsed) ? verifyParsed.length : 0}`);
        throw new BadRequestException('Kayıt doğrulanamadı. Lütfen tekrar deneyin.');
      }
      this.logger.log(`Homepage posts verified: ${verifyParsed.length} posts`);
    } catch (error) {
      this.logger.error(`Error saving homepage posts: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      if (error instanceof Error && error.message.includes('relation') && error.message.includes('does not exist')) {
        this.logger.error('Settings table does not exist. Run: backend/scripts/create-settings-table.sql');
        throw new BadRequestException('Settings tablosu bulunamadı. Yöneticiyle iletişime geçin veya scripts/create-settings-table.sql çalıştırın.');
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Ana sayfa blogları kaydedilemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  // Event Tracking
  async getEventTracking(filters?: {
    eventType?: EventType;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    try {
      const query = this.eventTrackingRepository.createQueryBuilder('event')
        .leftJoinAndSelect('event.user', 'user')
        .orderBy('event.createdAt', 'DESC');

      if (filters?.eventType) {
        query.andWhere('event.eventType = :eventType', { eventType: filters.eventType });
      }

      if (filters?.userId) {
        query.andWhere('event.userId = :userId', { userId: filters.userId });
      }

      if (filters?.startDate) {
        query.andWhere('event.createdAt >= :startDate', { startDate: filters.startDate });
      }

      if (filters?.endDate) {
        query.andWhere('event.createdAt <= :endDate', { endDate: filters.endDate });
      }

      if (filters?.limit) {
        query.limit(filters.limit);
      }

      const events = await query.getMany();
      this.logger.log(`Retrieved ${events.length} events with filters: ${JSON.stringify(filters)}`);
      return events;
    } catch (error) {
      this.logger.error(`Error getting event tracking: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new BadRequestException('Failed to retrieve event tracking data');
    }
  }

  async getEventTrackingStats(startDate?: Date, endDate?: Date) {
    try {
      const query = this.eventTrackingRepository.createQueryBuilder('event');

      if (startDate) {
        query.andWhere('event.createdAt >= :startDate', { startDate });
      }

      if (endDate) {
        query.andWhere('event.createdAt <= :endDate', { endDate });
      }

      const totalEvents = await query.getCount();

      const eventsByType = await this.eventTrackingRepository
        .createQueryBuilder('event')
        .select('event.eventType', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('event.eventType')
        .getRawMany();

      const eventsByPage = await this.eventTrackingRepository
        .createQueryBuilder('event')
        .select('event.page', 'page')
        .addSelect('COUNT(*)', 'count')
        .where('event.page IS NOT NULL')
        .groupBy('event.page')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany();

      this.logger.log(`Retrieved event tracking stats: ${totalEvents} total events`);
      return {
        totalEvents,
        eventsByType,
        topPages: eventsByPage,
      };
    } catch (error) {
      this.logger.error(`Error getting event tracking stats: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new BadRequestException('Failed to retrieve event tracking statistics');
    }
  }

  // User Behavior Tracking
  async getUserBehavior(filters?: {
    behaviorType?: BehaviorType;
    userId?: string;
    sessionId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    try {
      const query = this.userBehaviorRepository.createQueryBuilder('behavior')
        .leftJoinAndSelect('behavior.user', 'user')
        .orderBy('behavior.createdAt', 'DESC');

      if (filters?.behaviorType) {
        query.andWhere('behavior.behaviorType = :behaviorType', { behaviorType: filters.behaviorType });
      }

      if (filters?.userId) {
        query.andWhere('behavior.userId = :userId', { userId: filters.userId });
      }

      if (filters?.sessionId) {
        query.andWhere('behavior.sessionId = :sessionId', { sessionId: filters.sessionId });
      }

      if (filters?.startDate) {
        query.andWhere('behavior.createdAt >= :startDate', { startDate: filters.startDate });
      }

      if (filters?.endDate) {
        query.andWhere('behavior.createdAt <= :endDate', { endDate: filters.endDate });
      }

      if (filters?.limit) {
        query.limit(filters.limit);
      }

      const behaviors = await query.getMany();
      this.logger.log(`Retrieved ${behaviors.length} user behaviors with filters: ${JSON.stringify(filters)}`);
      return behaviors;
    } catch (error) {
      this.logger.error(`Error getting user behavior: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new BadRequestException('Failed to retrieve user behavior data');
    }
  }

  async createEventTracking(data: {
    eventType: EventType;
    eventName: string;
    userId?: string | null;
    page?: string | null;
    referrer?: string | null;
    properties?: Record<string, any> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    sessionId?: string | null;
  }) {
    try {
      const event = this.eventTrackingRepository.create({
        eventType: data.eventType,
        eventName: data.eventName,
        userId: data.userId || null,
        page: data.page || null,
        referrer: data.referrer || null,
        properties: data.properties || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        sessionId: data.sessionId || null,
      });
      await this.eventTrackingRepository.save(event);
      this.logger.log(`Event tracked: ${data.eventType} - ${data.eventName}`);
      return event;
    } catch (error) {
      this.logger.error(`Error creating event tracking: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new BadRequestException('Failed to create event tracking');
    }
  }

  async createUserBehavior(data: {
    behaviorType: BehaviorType;
    userId?: string | null;
    page?: string | null;
    sessionId?: string | null;
    data?: Record<string, any> | null;
    duration?: number | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    try {
      // Validate behaviorType explicitly to avoid null/invalid inserts
      if (!data.behaviorType || !Object.values(BehaviorType).includes(data.behaviorType)) {
        this.logger.warn(`createUserBehavior called with invalid behaviorType: ${String(data.behaviorType)}`);
        throw new BadRequestException('Invalid behaviorType');
      }

      const behavior = this.userBehaviorRepository.create({
        behaviorType: data.behaviorType,
        userId: data.userId || null,
        page: data.page || null,
        sessionId: data.sessionId || null,
        data: data.data || null,
        duration: data.duration || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      });
      await this.userBehaviorRepository.save(behavior);
      this.logger.log(`User behavior tracked: ${data.behaviorType}`);
      return behavior;
    } catch (error) {
      this.logger.error(`Error creating user behavior: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new BadRequestException('Failed to create user behavior');
    }
  }

  async getUserBehaviorStats(startDate?: Date, endDate?: Date) {
    try {
      const query = this.userBehaviorRepository.createQueryBuilder('behavior');

      if (startDate) {
        query.andWhere('behavior.createdAt >= :startDate', { startDate });
      }

      if (endDate) {
        query.andWhere('behavior.createdAt <= :endDate', { endDate });
      }

      const totalBehaviors = await query.getCount();

      const behaviorsByType = await this.userBehaviorRepository
        .createQueryBuilder('behavior')
        .select('behavior.behaviorType', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('behavior.behaviorType')
        .getRawMany();

      const avgSessionDuration = await this.userBehaviorRepository
        .createQueryBuilder('behavior')
        .select('AVG(behavior.duration)', 'avgDuration')
        .where('behavior.duration IS NOT NULL')
        .getRawOne();

      const uniqueSessions = await this.userBehaviorRepository
        .createQueryBuilder('behavior')
        .select('COUNT(DISTINCT behavior.sessionId)', 'count')
        .where('behavior.sessionId IS NOT NULL')
        .getRawOne();

      this.logger.log(`Retrieved user behavior stats: ${totalBehaviors} total behaviors`);
      return {
        totalBehaviors,
        behaviorsByType,
        avgSessionDuration: avgSessionDuration?.avgDuration || 0,
        uniqueSessions: uniqueSessions?.count || 0,
      };
    } catch (error) {
      this.logger.error(`Error getting user behavior stats: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new BadRequestException('Failed to retrieve user behavior statistics');
    }
  }

  // Observability Methods

  /**
   * Get recent jobs for a customer
   */
  async getRecentJobs(filters: {
    organizationId?: string;
    projectId?: string;
    limit?: number;
    status?: PostStatus;
  }) {
    const where: any = {};

    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }
    if (filters.projectId) {
      where.projectId = filters.projectId;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const posts = await this.postsRepository.find({
      where,
      relations: ['author', 'tags', 'revisions'],
      order: { createdAt: 'DESC' },
      take: filters.limit || 50,
    });

    return posts.map((post) => ({
      id: post.id,
      jobId: post.id, // Using post ID as job ID
      title: post.title,
      status: post.status,
      organizationId: post.organizationId,
      projectId: post.projectId,
      authorId: post.authorId,
      author: post.author ? {
        id: post.author.id,
        name: post.author.name,
        email: post.author.email,
      } : null,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      lastError: post.lastError,
      revisions: post.revisions?.map((rev) => ({
        version: rev.version,
        createdAt: rev.createdAt,
        tokensIn: rev.tokensIn,
        tokensOut: rev.tokensOut,
        latencyMs: rev.latencyMs,
      })) || [],
    }));
  }

  /**
   * Get errors for a customer
   */
  async getErrors(filters: {
    organizationId?: string;
    projectId?: string;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {
      status: PostStatus.FAILED,
    };

    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }
    if (filters.projectId) {
      where.projectId = filters.projectId;
    }
    if (filters.startDate) {
      where.createdAt = MoreThan(filters.startDate);
    }
    if (filters.endDate) {
      where.updatedAt = LessThan(filters.endDate);
    }

    const posts = await this.postsRepository.find({
      where,
      relations: ['author'],
      order: { updatedAt: 'DESC' },
      take: filters.limit || 50,
    });

    return posts.map((post) => ({
      id: post.id,
      jobId: post.id,
      title: post.title,
      error: post.lastError,
      organizationId: post.organizationId,
      projectId: post.projectId,
      authorId: post.authorId,
      createdAt: post.createdAt,
      failedAt: post.updatedAt,
    }));
  }

  /**
   * Get usage graph data for a customer
   */
  async getUsageGraph(filters: {
    organizationId?: string;
    projectId?: string;
    days?: number;
  }) {
    const days = filters.days || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const where: any = {
      createdAt: MoreThan(startDate),
    };

    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }
    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    // Get usage records grouped by day
    const usageRecords = await this.usageLedgerRepository
      .createQueryBuilder('usage')
      .select('DATE(usage.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(usage.tokensIn + usage.tokensOut)', 'totalTokens')
      .where(where)
      .groupBy('DATE(usage.createdAt)')
      .orderBy('DATE(usage.createdAt)', 'ASC')
      .getRawMany();

    // Get posts count by day
    const postsByDay = await this.postsRepository
      .createQueryBuilder('post')
      .select('DATE(post.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where(where)
      .groupBy('DATE(post.createdAt)')
      .orderBy('DATE(post.createdAt)', 'ASC')
      .getRawMany();

    // Combine data
    const usageMap = new Map(usageRecords.map((r) => [r.date, r]));
    const postsMap = new Map(postsByDay.map((r) => [r.date, r]));

    const result = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      result.push({
        date: dateStr,
        jobs: parseInt(postsMap.get(dateStr)?.count || '0', 10),
        tokens: parseInt(usageMap.get(dateStr)?.totalTokens || '0', 10),
        requests: parseInt(usageMap.get(dateStr)?.count || '0', 10),
      });
    }

    return result;
  }

  /**
   * Get webhook delivery logs
   */
  async getWebhookLogs(filters: {
    organizationId?: string;
    projectId?: string;
    limit?: number;
    status?: 'success' | 'failed' | 'pending';
  }) {
    // Note: This is a simplified version. In production, you'd want a separate WebhookDeliveryLog entity
    const where: any = {};

    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }
    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    const webhooks = await this.webhookRepository.find({
      where,
      order: { updatedAt: 'DESC' },
      take: filters.limit || 50,
    });

    // Return webhook status as delivery logs
    // In production, you'd query a separate WebhookDeliveryLog table
    return webhooks.map((webhook) => ({
      id: webhook.id,
      url: webhook.url,
      status: webhook.active ? 'success' : 'failed',
      events: webhook.events,
      organizationId: webhook.organizationId,
      projectId: webhook.projectId,
      lastDeliveryAt: webhook.updatedAt,
      createdAt: webhook.createdAt,
    }));
  }
}

