import { prisma } from '../config/prisma';

export class NotificationService {
  /** Lista notificações do usuário restritas à equipe ativa (ou globais, teamId null) */
  async list(userId: number, teamId: number) {
    return prisma.notification.findMany({
      where: { userId, OR: [{ teamId }, { teamId: null }] },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async markAsRead(id: number) {
    await prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllAsRead(userId: number, teamId: number) {
    await prisma.notification.updateMany({
      where: { userId, OR: [{ teamId }, { teamId: null }] },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: number, teamId: number) {
    return prisma.notification.count({
      where: { userId, isRead: false, OR: [{ teamId }, { teamId: null }] },
    });
  }

  async create(data: { title: string; message?: string; type?: any; userId: number; teamId?: number; link?: string }) {
    return prisma.notification.create({ data });
  }
}

export const notificationService = new NotificationService();
