import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '../entities/user.entity';
import { NotificationType } from '../entities/notification.entity';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // Kullanıcı bildirimleri
  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyNotifications(
    @CurrentUser() user: User,
    @Query('unread') unread?: string,
    @Query('limit') limit?: string,
  ) {
    const onlyUnread = unread === 'true';
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const notifications = await this.notificationService.findForUser(user.id, onlyUnread, parsedLimit);
    return {
      success: true,
      data: notifications,
    };
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.notificationService.getUnreadCount(user.id);
    return {
      success: true,
      data: { count },
    };
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@CurrentUser() user: User, @Param('id') id: string) {
    const notification = await this.notificationService.markAsRead(user.id, id);
    return {
      success: true,
      data: notification,
    };
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  async markAllAsRead(@CurrentUser() user: User) {
    const result = await this.notificationService.markAllAsRead(user.id);
    return {
      success: true,
      data: result,
    };
  }

  // Admin broadcast
  @Post('broadcast')
  @UseGuards(JwtAuthGuard)
  async broadcast(
    @CurrentUser() user: User,
    @Body()
    body: {
      title: string;
      message?: string;
      type?: NotificationType;
      linkUrl?: string;
    },
  ) {
    const result = await this.notificationService.broadcast(user, body);
    return {
      success: true,
      message: 'Broadcast notification sent',
      data: result,
    };
  }
}


