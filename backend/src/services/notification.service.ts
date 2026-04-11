import { prisma } from '../config/prisma';

export class NotificationService {
  async list(userId: number) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async markAsRead(id: number) {
    await prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllAsRead(userId: number) {
    await prisma.notification.updateMany({ where: { userId }, data: { isRead: true } });
  }

  async getUnreadCount(userId: number) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  async create(data: { title: string; message?: string; type?: any; userId: number; link?: string }) {
    return prisma.notification.create({ data });
  }
}

export const notificationService = new NotificationService();
