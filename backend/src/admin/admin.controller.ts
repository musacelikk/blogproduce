import { Controller, Get, Post, Patch, Delete, Query, Param, Body, UseGuards, Header, HttpException, HttpStatus, Logger, Req } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { AdminService } from './admin.service';
import { MetricsService } from '../common/services/metrics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Public } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User, UserRole } from '../entities/user.entity';
import { ActivityType, ActivitySeverity } from '../entities/activity-log.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { PostStatus } from '../entities/post.entity';
import { CreateUserBehaviorDto } from './dto/create-user-behavior.dto';
import { RecordPurchaseDto } from './dto/record-purchase.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private usageService: UsageService,
    private adminService: AdminService,
    private metricsService: MetricsService,
  ) {}

  // Public Plans Endpoint (for frontend pricing page - no auth required)
  @Get('plans/public')
  @Public()
  async getPublicPlans() {
    const plans = await this.adminService.getAllPlans();
    // Only return active plans
    const activePlans = plans.filter(plan => plan.active);
    return {
      success: true,
      data: activePlans,
    };
  }

  // Dashboard Stats
  @Get('dashboard/stats')
  async getDashboardStats(@CurrentUser() user: User) {
    const stats = await this.adminService.getDashboardStats();
    return {
      success: true,
      data: stats,
    };
  }

  // Activity Logs (must be before dynamic routes like users/:id to avoid route conflicts)
  @Get('activities')
  async getActivityLogs(
    @CurrentUser() user: User,
    @Query('type') type?: ActivityType,
    @Query('severity') severity?: ActivitySeverity,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: any = {};
    if (type) filters.type = type;
    if (severity) filters.severity = severity;
    if (userId) filters.userId = userId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = parseInt(limit, 10);

    const logs = await this.adminService.getActivityLogs(filters);
    return {
      success: true,
      data: logs,
    };
  }

  // Users Management
  @Get('users')
  async getAllUsers(@CurrentUser() user: User) {
    const users = await this.adminService.getAllUsers();
    return {
      success: true,
      data: users,
    };
  }

  @Get('users/:id')
  async getUserById(@CurrentUser() user: User, @Param('id') id: string) {
    const userData = await this.adminService.getUserById(id);
    return {
      success: true,
      data: userData,
    };
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('role') role: 'user' | 'admin',
  ) {
    const updatedUser = await this.adminService.updateUserRole(id, role);
    return {
      success: true,
      data: updatedUser,
    };
  }

  @Patch('users/:id')
  async updateUser(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateData: UpdateUserDto,
  ) {
    const updatedUser = await this.adminService.updateUser(id, updateData);
    return {
      success: true,
      data: updatedUser,
    };
  }

  @Delete('users/:id')
  async deleteUser(@CurrentUser() user: User, @Param('id') id: string) {
    await this.adminService.deleteUser(id);
    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  // Posts Management
  @Get('posts')
  async getAllPosts(
    @CurrentUser() user: User,
    @Query('status') status?: string,
    @Query('authorId') authorId?: string,
    @Query('workspaceId') workspaceId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const posts = await this.adminService.getAllPosts({ 
      status, 
      authorId, 
      workspaceId,
      page: pageNum,
      limit: limitNum,
    });
    return {
      success: true,
      data: posts.data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: posts.total,
        totalPages: posts.totalPages,
      },
    };
  }

  @Get('posts/:id')
  async getPostById(@CurrentUser() user: User, @Param('id') id: string) {
    const post = await this.adminService.getPostById(id);
    return {
      success: true,
      data: post,
    };
  }

  /**
   * Permanently delete any user's post, regardless of owner.
   *
   * The controller carries `@Roles(UserRole.ADMIN)` at class level, but it is
   * repeated here deliberately: this is the most destructive route on the
   * surface, and a future refactor that loosens the class-level guard must not
   * silently expose it.
   */
  @Delete('posts/:id')
  @Roles(UserRole.ADMIN)
  async deletePost(@CurrentUser() admin: User, @Param('id') id: string) {
    this.logger.warn(`Admin ${admin.email} is deleting post ${id}`);
    await this.adminService.deletePost(id);
    return {
      success: true,
      message: 'Blog kalıcı olarak silindi',
    };
  }

  @Patch('posts/:id/hide')
  async hidePost(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    const post = await this.adminService.hidePost(id, reason);
    return {
      success: true,
      message: 'Blog başarıyla gizlendi ve taslağa alındı',
      data: post,
    };
  }

  @Patch('posts/:id/unhide')
  async unhidePost(@CurrentUser() user: User, @Param('id') id: string) {
    const post = await this.adminService.unhidePost(id);
    return {
      success: true,
      message: 'Blog gizleme işlemi kaldırıldı',
      data: post,
    };
  }

  // Workspaces Management
  @Get('workspaces')
  async getAllWorkspaces(
    @CurrentUser() user: User,
    @Query('ownerId') ownerId?: string,
  ) {
    const workspaces = await this.adminService.getAllWorkspaces({ ownerId });
    return {
      success: true,
      data: workspaces,
    };
  }

  @Get('workspaces/:id')
  async getWorkspaceById(@CurrentUser() user: User, @Param('id') id: string) {
    const workspace = await this.adminService.getWorkspaceById(id);
    return {
      success: true,
      data: workspace,
    };
  }

  // Usage Stats
  @Get('usage/stats')
  async getUsageStats(@CurrentUser() user: User, @Query('month') month?: string) {
    const stats = await this.usageService.getUsageStats(month);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('usage/all')
  async getAllUsage(@CurrentUser() user: User, @Query('month') month?: string) {
    const usage = await this.usageService.getAllUsage(month);
    return {
      success: true,
      data: usage,
    };
  }

  // Plans Management (must be before dynamic routes)
  @Get('plans')
  async getAllPlans(@CurrentUser() user: User) {
    const plans = await this.adminService.getAllPlans();
    return {
      success: true,
      data: plans,
    };
  }

  @Get('plans/:id')
  async getPlanById(@CurrentUser() user: User, @Param('id') id: string) {
    const plan = await this.adminService.getPlanById(id);
    return {
      success: true,
      data: plan,
    };
  }

  @Post('plans')
  async createPlan(@CurrentUser() user: User, @Body() planData: any) {
    const plan = await this.adminService.createPlan(planData);
    return {
      success: true,
      data: plan,
    };
  }

  @Patch('plans/:id')
  async updatePlan(@CurrentUser() user: User, @Param('id') id: string, @Body() updateData: any) {
    const plan = await this.adminService.updatePlan(id, updateData);
    return {
      success: true,
      data: plan,
    };
  }

  @Delete('plans/:id')
  async deletePlan(@CurrentUser() user: User, @Param('id') id: string) {
    await this.adminService.deletePlan(id);
    return {
      success: true,
      message: 'Plan deleted successfully',
    };
  }

  @Patch('users/:id/plan')
  async updateUserPlan(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('planId') planId: string | null,
  ) {
    const updatedUser = await this.adminService.updateUserPlan(id, planId);
    return {
      success: true,
      data: updatedUser,
    };
  }

  // Subscriptions Management
  @Get('subscriptions')
  async getAllSubscriptions(
    @CurrentUser() user: User,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    const subscriptions = await this.adminService.getAllSubscriptions({
      status: status as any,
      userId,
    });
    return {
      success: true,
      data: subscriptions,
    };
  }

  // Payments Management
  @Get('payments')
  async getAllPayments(
    @CurrentUser() user: User,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('subscriptionId') subscriptionId?: string,
  ) {
    const payments = await this.adminService.getAllPayments({
      status: status as any,
      userId,
      subscriptionId,
    });
    return {
      success: true,
      data: payments,
    };
  }

  // Sales Stats
  @Get('sales/stats')
  async getSalesStats(
    @CurrentUser() user: User,
    @Query('month') month?: string,
  ) {
    const stats = await this.adminService.getSalesStats(month);
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Satın alma kaydı: ödeme + abonelik oluşturur/uzatır.
   * Ödeme yöntemi eklenmeden manuel veya harici sistemden çağrılabilir.
   * Satın alındıkça kullanım süresi ve paket güncellenir.
   */
  @Post('purchases')
  async recordPurchase(
    @CurrentUser() user: User,
    @Body() body: RecordPurchaseDto,
  ) {
    const result = await this.adminService.recordPurchase({
      userId: body.userId,
      planId: body.planId,
      billingPeriod: body.billingPeriod,
      amount: body.amount,
      paymentMethod: body.paymentMethod,
      transactionId: body.transactionId,
      notes: body.notes,
    });
    return {
      success: true,
      message: 'Satın alma kaydedildi; abonelik ve kullanım süresi güncellendi.',
      data: result,
    };
  }

  // Homepage Management
  /** Ana sayfada gösterilecek blog ID listesi – auth yok (public site için) */
  @Get('homepage/posts/public')
  @Public()
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  async getHomepagePostsPublic() {
    const postIds = await this.adminService.getHomepagePosts();
    return {
      success: true,
      data: postIds,
    };
  }

  @Get('homepage/posts')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  async getHomepagePosts(@CurrentUser() user: User) {
    const postIds = await this.adminService.getHomepagePosts();
    return {
      success: true,
      data: postIds,
    };
  }

  @Post('homepage/posts')
  async setHomepagePosts(
    @CurrentUser() user: User,
    @Body() body: { postIds?: string[] | number[] },
  ) {
    // Normalize: string[], dedupe, preserve order
    const raw = Array.isArray(body.postIds) ? body.postIds : [];
    const seen = new Set<string>();
    const postIds = raw
      .map((id) => String(id))
      .filter((id) => {
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    this.logger.log(`POST /admin/homepage/posts - Received postIds: ${postIds.length}`, postIds);
    await this.adminService.setHomepagePosts(postIds);
    return {
      success: true,
      message: 'Homepage posts updated successfully',
      data: postIds,
    };
  }

  // Event Tracking
  @Get('events')
  async getEventTracking(
    @CurrentUser() user: User,
    @Query('eventType') eventType?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const filters: any = {};
      if (eventType) filters.eventType = eventType;
      if (userId) filters.userId = userId;
      if (startDate) {
        const date = new Date(startDate);
        if (isNaN(date.getTime())) {
          throw new HttpException('Invalid startDate format', HttpStatus.BAD_REQUEST);
        }
        filters.startDate = date;
      }
      if (endDate) {
        const date = new Date(endDate);
        if (isNaN(date.getTime())) {
          throw new HttpException('Invalid endDate format', HttpStatus.BAD_REQUEST);
        }
        filters.endDate = date;
      }
      if (limit) {
        const limitNum = parseInt(limit, 10);
        if (isNaN(limitNum) || limitNum < 1) {
          throw new HttpException('Invalid limit value', HttpStatus.BAD_REQUEST);
        }
        filters.limit = limitNum;
      }

      const events = await this.adminService.getEventTracking(filters);
      return {
        success: true,
        data: events,
      };
    } catch (error) {
      this.logger.error(`Error in getEventTracking: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to retrieve event tracking data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('events/stats')
  async getEventTrackingStats(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      let startDateObj: Date | undefined;
      let endDateObj: Date | undefined;

      if (startDate) {
        startDateObj = new Date(startDate);
        if (isNaN(startDateObj.getTime())) {
          throw new HttpException('Invalid startDate format', HttpStatus.BAD_REQUEST);
        }
      }

      if (endDate) {
        endDateObj = new Date(endDate);
        if (isNaN(endDateObj.getTime())) {
          throw new HttpException('Invalid endDate format', HttpStatus.BAD_REQUEST);
        }
      }

      const stats = await this.adminService.getEventTrackingStats(startDateObj, endDateObj);
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error(`Error in getEventTrackingStats: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to retrieve event tracking statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // User Behavior Tracking
  @Get('behaviors')
  async getUserBehavior(
    @CurrentUser() user: User,
    @Query('behaviorType') behaviorType?: string,
    @Query('userId') userId?: string,
    @Query('sessionId') sessionId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const filters: any = {};
      if (behaviorType) filters.behaviorType = behaviorType;
      if (userId) filters.userId = userId;
      if (sessionId) filters.sessionId = sessionId;
      if (startDate) {
        const date = new Date(startDate);
        if (isNaN(date.getTime())) {
          throw new HttpException('Invalid startDate format', HttpStatus.BAD_REQUEST);
        }
        filters.startDate = date;
      }
      if (endDate) {
        const date = new Date(endDate);
        if (isNaN(date.getTime())) {
          throw new HttpException('Invalid endDate format', HttpStatus.BAD_REQUEST);
        }
        filters.endDate = date;
      }
      if (limit) {
        const limitNum = parseInt(limit, 10);
        if (isNaN(limitNum) || limitNum < 1) {
          throw new HttpException('Invalid limit value', HttpStatus.BAD_REQUEST);
        }
        filters.limit = limitNum;
      }

      const behaviors = await this.adminService.getUserBehavior(filters);
      return {
        success: true,
        data: behaviors,
      };
    } catch (error) {
      this.logger.error(`Error in getUserBehavior: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to retrieve user behavior data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Public endpoint for event tracking (no auth required)
  @Post('events/track')
  @Public()
  async createEventTracking(
    @Body() body: {
      eventType: string;
      eventName: string;
      userId?: string | null;
      page?: string | null;
      referrer?: string | null;
      properties?: Record<string, any> | null;
      ipAddress?: string | null;
      userAgent?: string | null;
      sessionId?: string | null;
    },
    @Req() req: any,
  ) {
    try {
      // Get IP and User Agent from request if not provided
      const ipAddress = body.ipAddress || req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null;
      const userAgent = body.userAgent || req.headers['user-agent'] || null;

      const event = await this.adminService.createEventTracking({
        eventType: body.eventType as any,
        eventName: body.eventName,
        userId: body.userId || null,
        page: body.page || null,
        referrer: body.referrer || null,
        properties: body.properties || null,
        ipAddress: ipAddress,
        userAgent: userAgent,
        sessionId: body.sessionId || null,
      });

      return {
        success: true,
        data: event,
      };
    } catch (error) {
      this.logger.error(`Error in createEventTracking: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to create event tracking', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Public endpoint for user behavior tracking (no auth required)
  @Post('behaviors/track')
  @Public()
  async createUserBehavior(
    @Body() body: CreateUserBehaviorDto,
    @Req() req: any,
  ) {
    try {
      // Get IP and User Agent from request if not provided
      const ipAddress = body.ipAddress || req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null;
      const userAgent = body.userAgent || req.headers['user-agent'] || null;

      const behavior = await this.adminService.createUserBehavior({
        behaviorType: body.behaviorType as any,
        userId: body.userId || null,
        page: body.page || null,
        sessionId: body.sessionId || null,
        data: body.data || null,
        duration: body.duration || null,
        ipAddress: ipAddress,
        userAgent: userAgent,
      });

      return {
        success: true,
        data: behavior,
      };
    } catch (error) {
      this.logger.error(`Error in createUserBehavior: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to create user behavior', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('behaviors/stats')
  async getUserBehaviorStats(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      let startDateObj: Date | undefined;
      let endDateObj: Date | undefined;

      if (startDate) {
        startDateObj = new Date(startDate);
        if (isNaN(startDateObj.getTime())) {
          throw new HttpException('Invalid startDate format', HttpStatus.BAD_REQUEST);
        }
      }

      if (endDate) {
        endDateObj = new Date(endDate);
        if (isNaN(endDateObj.getTime())) {
          throw new HttpException('Invalid endDate format', HttpStatus.BAD_REQUEST);
        }
      }

      const stats = await this.adminService.getUserBehaviorStats(startDateObj, endDateObj);
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error(`Error in getUserBehaviorStats: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to retrieve user behavior statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Observability Endpoints

  /**
   * Get metrics (global or customer-specific)
   */
  @Get('observability/metrics')
  async getMetrics(
    @CurrentUser() user: User,
    @Query('organizationId') organizationId?: string,
    @Query('projectId') projectId?: string,
  ) {
    const metrics = await this.metricsService.getMetrics(organizationId, projectId);
    return {
      success: true,
      data: metrics,
      requestId: (global as any).requestId, // From interceptor
    };
  }

  /**
   * Get recent jobs for a customer
   */
  @Get('observability/jobs')
  async getRecentJobs(
    @CurrentUser() user: User,
    @Query('organizationId') organizationId?: string,
    @Query('projectId') projectId?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: PostStatus,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const jobs = await this.adminService.getRecentJobs({
      organizationId,
      projectId,
      limit: limitNum,
      status,
    });
    return {
      success: true,
      data: jobs,
      requestId: (global as any).requestId,
    };
  }

  /**
   * Get errors for a customer
   */
  @Get('observability/errors')
  async getErrors(
    @CurrentUser() user: User,
    @Query('organizationId') organizationId?: string,
    @Query('projectId') projectId?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const errors = await this.adminService.getErrors({
      organizationId,
      projectId,
      limit: limitNum,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    return {
      success: true,
      data: errors,
      requestId: (global as any).requestId,
    };
  }

  /**
   * Get usage graph data for a customer
   */
  @Get('observability/usage')
  async getUsageGraph(
    @CurrentUser() user: User,
    @Query('organizationId') organizationId?: string,
    @Query('projectId') projectId?: string,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    const usage = await this.adminService.getUsageGraph({
      organizationId,
      projectId,
      days: daysNum,
    });
    return {
      success: true,
      data: usage,
      requestId: (global as any).requestId,
    };
  }

  /**
   * Get webhook delivery logs
   */
  @Get('observability/webhooks')
  async getWebhookLogs(
    @CurrentUser() user: User,
    @Query('organizationId') organizationId?: string,
    @Query('projectId') projectId?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: 'success' | 'failed' | 'pending',
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const logs = await this.adminService.getWebhookLogs({
      organizationId,
      projectId,
      limit: limitNum,
      status,
    });
    return {
      success: true,
      data: logs,
      requestId: (global as any).requestId,
    };
  }
}

