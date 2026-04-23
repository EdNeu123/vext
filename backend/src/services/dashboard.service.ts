import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

type CardSlice = { stage: string; value: unknown };

const toNum = (v: unknown): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export class DashboardService {
  /**
   * Métricas consolidadas do dashboard.
   * Retorna sempre 200 com `isEmpty: true` quando não há dados,
   * em vez de lançar 500 — o frontend exibe estado vazio.
   */
  async getMetrics(userId: number, role: string) {
    try {
      const where = role !== 'admin' ? { ownerId: userId } : {};

      const [cards, contactCount, pendingTasks] = await Promise.all([
        prisma.card.findMany({
          where,
          select: { stage: true, value: true },
        }),
        role !== 'admin'
          ? prisma.contact.count({ where: { ownerId: userId } })
          : prisma.contact.count(),
        prisma.task.count({
          where: { status: 'pending', ...(role !== 'admin' ? { ownerId: userId } : {}) },
        }),
      ]);

      const list = cards as CardSlice[];
      const won = list.filter((d: CardSlice) => d.stage === 'won');
      const lost = list.filter((d: CardSlice) => d.stage === 'lost');
      const active = list.filter((d: CardSlice) => !['won', 'lost'].includes(d.stage));
      const closed = won.length + lost.length;

      const sum = (arr: CardSlice[]): number =>
        arr.reduce((acc: number, d: CardSlice) => acc + toNum(d.value), 0);

      const isEmpty = list.length === 0 && contactCount === 0 && pendingTasks === 0;

      return {
        totalPipeline: sum(active),
        wonDeals: sum(won),
        lostDeals: sum(lost),
        activeDeals: active.length,
        conversionRate: closed > 0 ? (won.length / closed) * 100 : 0,
        avgDealValue: won.length > 0 ? sum(won) / won.length : 0,
        contactCount,
        pendingTasks,
        isEmpty,
        emptyMessage: isEmpty
          ? 'Ainda não há dados suficientes para montar o dashboard. Crie seu primeiro contato, card ou tarefa para começar.'
          : null,
      };
    } catch (error) {
      logger.error('DashboardService.getMetrics falhou', {
        userId,
        role,
        error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
      });
      throw error;
    }
  }

  /**
   * Progresso da meta de vendas do usuário.
   * Se o usuário não existir ou não tiver meta, devolve payload neutro em vez de crashar.
   */
  async getGoalProgress(userId: number) {
    try {
      const [user, wonDeals] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, salesGoal: true },
        }),
        prisma.card.findMany({
          where: { ownerId: userId, stage: 'won' },
          select: { value: true },
        }),
      ]);

      if (!user) {
        return {
          current: 0,
          target: 0,
          progress: 0,
          isEmpty: true,
          emptyMessage: 'Usuário não encontrado para cálculo de meta.',
        };
      }

      const deals = wonDeals as { value: unknown }[];
      const current = deals.reduce(
        (acc: number, d: { value: unknown }) => acc + toNum(d.value),
        0
      );
      const target = toNum(user.salesGoal) > 0 ? toNum(user.salesGoal) : 50000;
      const progress = target > 0 ? (current / target) * 100 : 0;

      const isEmpty = deals.length === 0;

      return {
        current,
        target,
        progress,
        isEmpty,
        emptyMessage: isEmpty
          ? 'Você ainda não fechou nenhum card. Quando ganhar seu primeiro negócio, o progresso da meta aparecerá aqui.'
          : null,
      };
    } catch (error) {
      logger.error('DashboardService.getGoalProgress falhou', {
        userId,
        error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
      });
      throw error;
    }
  }

  /**
   * Tarefas de hoje.
   */
  async getTodayTasks(userId: number, role: string) {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const where: Record<string, unknown> = { dueDate: { gte: start, lte: end } };
      if (role !== 'admin') where.ownerId = userId;

      return await prisma.task.findMany({
        where,
        orderBy: { dueDate: 'asc' },
        include: {
          contact: { select: { id: true, name: true } },
          card: { select: { id: true, title: true } },
        },
      });
    } catch (error) {
      logger.error('DashboardService.getTodayTasks falhou', {
        userId,
        role,
        error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
      });
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
