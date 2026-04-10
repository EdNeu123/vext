import { prisma } from '../config/prisma';

export class DashboardService {
  async getMetrics(userId: number, role: string) {
    const where = role !== 'admin' ? { ownerId: userId } : {};
    const cards = await prisma.card.findMany({ where });

    const toNum = (v: any) => Number(v || 0);
    const won = cards.filter((d) => d.stage === 'won');
    const lost = cards.filter((d) => d.stage === 'lost');
    const active = cards.filter((d) => !['won', 'lost'].includes(d.stage));
    const closed = won.length + lost.length;

    const contactCount = await prisma.contact.count(role !== 'admin' ? { where: { ownerId: userId } } : {});
    const pendingTasks = await prisma.task.count({
      where: { status: 'pending', ...(role !== 'admin' ? { ownerId: userId } : {}) },
    });

    return {
      totalPipeline: active.reduce((acc, d) => acc + toNum(d.value), 0),
      wonDeals: won.reduce((acc, d) => acc + toNum(d.value), 0),
      lostDeals: lost.reduce((acc, d) => acc + toNum(d.value), 0),
      activeDeals: active.length,
      conversionRate: closed > 0 ? (won.length / closed) * 100 : 0,
      avgDealValue: won.length > 0 ? won.reduce((acc, d) => acc + toNum(d.value), 0) / won.length : 0,
      contactCount,
      pendingTasks,
    };
  }

  async getGoalProgress(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const wonDeals = await prisma.card.findMany({
      where: { ownerId: userId, stage: 'won' },
    });

    const current = wonDeals.reduce((acc, d) => acc + Number(d.value), 0);
    const target = user?.salesGoal ? Number(user.salesGoal) : 50000;

    return { current, target, progress: (current / target) * 100 };
  }

  async getTodayTasks(userId: number, role: string) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const where: any = { dueDate: { gte: start, lte: end } };
    if (role !== 'admin') where.ownerId = userId;

    return prisma.task.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        contact: { select: { id: true, name: true } },
        card: { select: { id: true, title: true } },
      },
    });
  }
}

export const dashboardService = new DashboardService();
