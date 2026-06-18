import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

type CardSlice = { stage: string; value: unknown };

const toNum = (v: unknown): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export class DashboardService {
  /**
   * Métricas consolidadas do dashboard, escopadas à equipe ativa.
   * Retorna sempre 200 com `isEmpty: true` quando não há dados,
   * em vez de lançar 500 — o frontend exibe estado vazio.
   */
  async getMetrics(teamId: number) {
    try {
      const where = { teamId };

      const [cards, contactCount, pendingTasks] = await Promise.all([
        prisma.card.findMany({ where, select: { stage: true, value: true } }),
        prisma.contact.count({ where: { teamId } }),
        prisma.task.count({ where: { status: 'pending', teamId } }),
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
        teamId,
        error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
      });
      throw error;
    }
  }

  /**
   * Progresso da meta de vendas do usuário, restrito aos cards "won"
   * da equipe ativa (um usuário pode ter cards em várias equipes).
   * Se o usuário não existir ou não tiver meta, devolve payload neutro em vez de crashar.
   */
  async getGoalProgress(userId: number, teamId: number) {
    try {
      const [user, wonDeals] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, salesGoal: true },
        }),
        prisma.card.findMany({
          where: { ownerId: userId, teamId, stage: 'won' },
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
        userId, teamId,
        error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
      });
      throw error;
    }
  }

  /**
   * Tarefas de hoje, escopadas à equipe ativa.
   */
  async getTodayTasks(teamId: number) {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      return await prisma.task.findMany({
        where: { teamId, dueDate: { gte: start, lte: end } },
        orderBy: { dueDate: 'asc' },
        include: {
          contact: { select: { id: true, name: true } },
          card: { select: { id: true, title: true } },
        },
      });
    } catch (error) {
      logger.error('DashboardService.getTodayTasks falhou', {
        teamId,
        error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
      });
      throw error;
    }
  }

  /**
   * Séries temporais para os KPIs (modal "Ver mais" no dashboard), escopadas à equipe.
   * Agrega por dia (last 7d/30d) ou por mês (last 12m).
   *
   * metric: 'pipeline' | 'won' | 'conversion' | 'avgTicket'
   * period: '7d' | '30d' | '12m'
   *
   * Retorna { points: [{ date, value }], comparison: { current, previous, deltaPct } }
   */
  async getTimeseries(
    teamId: number,
    metric: 'pipeline' | 'won' | 'conversion' | 'avgTicket',
    period: '7d' | '30d' | '12m' = '30d',
  ) {
    try {
      const now = new Date();
      const teamWhere = { teamId };

      // Buckets de tempo
      const buckets: { start: Date; end: Date; label: string }[] = [];
      if (period === '12m') {
        for (let i = 11; i >= 0; i--) {
          const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
          buckets.push({ start, end, label: start.toISOString().slice(0, 7) }); // YYYY-MM
        }
      } else {
        const days = period === '7d' ? 7 : 30;
        for (let i = days - 1; i >= 0; i--) {
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0);
          const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1, 0, 0, 0);
          buckets.push({ start, end, label: start.toISOString().slice(0, 10) }); // YYYY-MM-DD
        }
      }

      const overallStart = buckets[0].start;
      const overallEnd = buckets[buckets.length - 1].end;

      // Para cada métrica, busca os dados relevantes uma vez
      const points: { date: string; value: number }[] = [];

      if (metric === 'pipeline') {
        // Pipeline ativo no fim de cada bucket (cards criados <= bucket.end e não fechados antes)
        const allCards = await prisma.card.findMany({
          where: { ...teamWhere, createdAt: { lte: overallEnd } },
          select: { value: true, createdAt: true, closedAt: true, stage: true },
        });
        for (const b of buckets) {
          const active = allCards.filter(c =>
            c.createdAt <= b.end &&
            (!c.closedAt || c.closedAt > b.end) &&
            !['won', 'lost'].includes(c.stage),
          );
          const sum = active.reduce((acc, c) => acc + toNum(c.value), 0);
          points.push({ date: b.label, value: sum });
        }
      } else if (metric === 'won') {
        // Soma de cards ganhos fechados em cada bucket
        const won = await prisma.card.findMany({
          where: {
            ...teamWhere,
            stage: 'won',
            closedAt: { gte: overallStart, lt: overallEnd },
          },
          select: { value: true, closedAt: true },
        });
        for (const b of buckets) {
          const inBucket = won.filter(c => c.closedAt && c.closedAt >= b.start && c.closedAt < b.end);
          points.push({
            date: b.label,
            value: inBucket.reduce((acc, c) => acc + toNum(c.value), 0),
          });
        }
      } else if (metric === 'conversion') {
        // (won / (won + lost)) * 100 fechados em cada bucket
        const closed = await prisma.card.findMany({
          where: {
            ...teamWhere,
            stage: { in: ['won', 'lost'] },
            closedAt: { gte: overallStart, lt: overallEnd },
          },
          select: { stage: true, closedAt: true },
        });
        for (const b of buckets) {
          const inBucket = closed.filter(c => c.closedAt && c.closedAt >= b.start && c.closedAt < b.end);
          const w = inBucket.filter(c => c.stage === 'won').length;
          const total = inBucket.length;
          points.push({ date: b.label, value: total > 0 ? Math.round((w / total) * 100) : 0 });
        }
      } else if (metric === 'avgTicket') {
        // Ticket médio dos cards fechados (won) em cada bucket
        const won = await prisma.card.findMany({
          where: {
            ...teamWhere,
            stage: 'won',
            closedAt: { gte: overallStart, lt: overallEnd },
          },
          select: { value: true, closedAt: true },
        });
        for (const b of buckets) {
          const inBucket = won.filter(c => c.closedAt && c.closedAt >= b.start && c.closedAt < b.end);
          const sum = inBucket.reduce((acc, c) => acc + toNum(c.value), 0);
          points.push({
            date: b.label,
            value: inBucket.length > 0 ? Math.round(sum / inBucket.length) : 0,
          });
        }
      }

      // Comparativo: período atual vs período anterior de igual duração
      const half = Math.floor(points.length / 2);
      const previous = points.slice(0, half).reduce((acc, p) => acc + p.value, 0);
      const current = points.slice(half).reduce((acc, p) => acc + p.value, 0);
      const deltaPct = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;

      return {
        metric,
        period,
        points,
        comparison: { current, previous, deltaPct },
      };
    } catch (error) {
      logger.error('DashboardService.getTimeseries falhou', {
        teamId, metric, period,
        error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
      });
      throw error;
    }
  }

  /**
   * Métricas filtradas por mês específico (YYYY-MM), escopadas à equipe ativa.
   * Mesmo formato de getMetrics, mas considera só cards/tasks do mês.
   */
  async getMonthlyMetrics(teamId: number, monthStr: string) {
    try {
      const [year, month] = monthStr.split('-').map(Number);
      if (!year || !month || month < 1 || month > 12) {
        throw new Error(`Formato de mês inválido: ${monthStr}. Use YYYY-MM.`);
      }
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);

      const teamWhere = { teamId };

      const [activeCards, wonInMonth, lostInMonth, contactCount, pendingTasks] = await Promise.all([
        // Pipeline ativo NO FIM do mês
        prisma.card.findMany({
          where: {
            ...teamWhere,
            createdAt: { lt: end },
            OR: [{ closedAt: null }, { closedAt: { gte: end } }],
            stage: { notIn: ['won', 'lost'] },
          },
          select: { value: true },
        }),
        prisma.card.findMany({
          where: { ...teamWhere, stage: 'won', closedAt: { gte: start, lt: end } },
          select: { value: true },
        }),
        prisma.card.count({
          where: { ...teamWhere, stage: 'lost', closedAt: { gte: start, lt: end } },
        }),
        prisma.contact.count({ where: { teamId, createdAt: { lt: end } } }),
        prisma.task.count({
          where: { status: 'pending', dueDate: { gte: start, lt: end }, teamId },
        }),
      ]);

      const totalPipeline = activeCards.reduce((acc, c) => acc + toNum(c.value), 0);
      const wonValue = wonInMonth.reduce((acc, c) => acc + toNum(c.value), 0);
      const wonCount = wonInMonth.length;
      const totalClosed = wonCount + lostInMonth;

      return {
        month: monthStr,
        totalPipeline,
        wonDeals: wonValue,
        wonCount,
        lostCount: lostInMonth,
        activeDeals: activeCards.length,
        conversionRate: totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0,
        avgDealValue: wonCount > 0 ? Math.round(wonValue / wonCount) : 0,
        contactCount,
        pendingTasks,
        isEmpty: activeCards.length === 0 && wonCount === 0 && lostInMonth === 0,
      };
    } catch (error) {
      logger.error('DashboardService.getMonthlyMetrics falhou', {
        teamId, monthStr,
        error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
      });
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
