import { prisma } from '../config/prisma';
import { auditService } from './audit.service';
import { logger } from '../utils/logger';

type Seller = {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  salesGoal: unknown;
};
type WonCard = { ownerId: number; value: unknown };

const toNum = (v: unknown): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export class TeamService {
  async listMembers() {
    return prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, email: true, phone: true, avatar: true,
        role: true, salesGoal: true, lastSignedIn: true, createdAt: true,
      },
    });
  }

  async getSellers() {
    return prisma.user.findMany({
      where: { role: 'seller', isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, salesGoal: true },
    });
  }

  /**
   * Ranking de vendedores por valor ganho.
   * Retorna payload vazio com mensagem quando não há vendedores ativos,
   * em vez de lançar 500 ou devolver array vazio sem contexto.
   */
  async getSellerRanking() {
    try {
      const [sellersRaw, wonDealsRaw] = await Promise.all([
        prisma.user.findMany({
          where: { role: 'seller', isActive: true },
          select: { id: true, name: true, email: true, avatar: true, salesGoal: true },
        }),
        prisma.card.findMany({
          where: { stage: 'won' },
          select: { ownerId: true, value: true },
        }),
      ]);

      const sellers = sellersRaw as Seller[];
      const wonDeals = wonDealsRaw as WonCard[];

      if (sellers.length === 0) {
        return {
          ranking: [] as Array<Seller & { totalValue: number; dealsCount: number; progress: number }>,
          isEmpty: true,
          emptyMessage: 'Nenhum vendedor ativo na equipe. Adicione membros com o papel "vendedor" para ver o ranking.',
        };
      }

      const ranking = sellers
        .map((seller: Seller) => {
          const sellerDeals = wonDeals.filter((d: WonCard) => d.ownerId === seller.id);
          const totalValue = sellerDeals.reduce(
            (acc: number, d: WonCard) => acc + toNum(d.value),
            0
          );
          const goal = toNum(seller.salesGoal) > 0 ? toNum(seller.salesGoal) : 50000;
          return {
            ...seller,
            totalValue,
            dealsCount: sellerDeals.length,
            progress: goal > 0 ? (totalValue / goal) * 100 : 0,
          };
        })
        .sort((a, b) => b.totalValue - a.totalValue);

      const noSalesYet = ranking.every((r) => r.totalValue === 0);

      return {
        ranking,
        isEmpty: false,
        emptyMessage: noSalesYet
          ? 'Equipe cadastrada mas sem vendas fechadas ainda. O ranking atualiza assim que o primeiro card for ganho.'
          : null,
      };
    } catch (error) {
      logger.error('TeamService.getSellerRanking falhou', {
        error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
      });
      throw error;
    }
  }

  async updateMember(id: number, data: Record<string, unknown>, adminId: number, adminName: string) {
    // Whitelist: admin pode mudar role, permissions e salesGoal — nunca password ou email
    const allowed = ['role', 'permissions', 'salesGoal', 'isActive'] as const;
    const safe: Record<string, unknown> = {};
    for (const key of allowed) {
      if (data[key] !== undefined) safe[key] = data[key];
    }
    if (Object.keys(safe).length === 0) return;
    await prisma.user.update({ where: { id }, data: safe });
    await auditService.log('user', id, 'Membro Atualizado', adminId, adminName);
  }
}

export const teamService = new TeamService();
