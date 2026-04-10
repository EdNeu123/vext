import { prisma } from '../config/prisma';
import { auditService } from './audit.service';

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

  async getSellerRanking() {
    const sellers = await prisma.user.findMany({
      where: { role: 'seller', isActive: true },
      select: { id: true, name: true, email: true, avatar: true, salesGoal: true },
    });

    const wonDeals = await prisma.card.findMany({ where: { stage: 'won' } });

    return sellers
      .map((seller) => {
        const sellerDeals = wonDeals.filter((d) => d.ownerId === seller.id);
        const totalValue = sellerDeals.reduce((acc, d) => acc + Number(d.value), 0);
        const goal = seller.salesGoal ? Number(seller.salesGoal) : 50000;
        return {
          ...seller,
          totalValue,
          dealsCount: sellerDeals.length,
          progress: (totalValue / goal) * 100,
        };
      })
      .sort((a, b) => b.totalValue - a.totalValue);
  }

  async updateMember(id: number, data: Record<string, any>, adminId: number, adminName: string) {
    await prisma.user.update({ where: { id }, data });
    await auditService.log('user', id, 'Membro Atualizado', adminId, adminName);
  }
}

export const teamService = new TeamService();
