import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';
import { User, UserRole } from '../entities/user.entity';

interface CreateNotificationDto {
  userId: string;
  title: string;
  message?: string;
  type?: NotificationType;
  linkUrl?: string;
}

interface BroadcastNotificationDto {
  title: string;
  message?: string;
  type?: NotificationType;
  linkUrl?: string;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createForUser(data: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: data.userId,
      title: data.title,
      message: data.message || null,
      type: data.type || 'info',
      linkUrl: data.linkUrl || null,
    });
    return this.notificationRepository.save(notification);
  }

  async broadcast(admin: User, data: BroadcastNotificationDto): Promise<{ count: number }> {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can send broadcast notifications');
    }

    const users = await this.usersRepository.find();
    const notifications = users.map((user) =>
      this.notificationRepository.create({
        userId: user.id,
        title: data.title,
        message: data.message || null,
        type: data.type || 'info',
        linkUrl: data.linkUrl || null,
      }),
    );

    await this.notificationRepository.save(notifications);
    return { count: notifications.length };
  }

  async findForUser(userId: string, onlyUnread = false, limit = 10): Promise<Notification[]> {
    const qb = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .limit(limit);

    if (onlyUnread) {
      qb.andWhere('notification.isRead = :isRead', { isRead: false });
    }

    return qb.getMany();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(userId: string, id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({ where: { id } });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You cannot modify this notification');
    }

    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationRepository.update({ userId, isRead: false }, { isRead: true });
    return { updated: result.affected || 0 };
  }
}


