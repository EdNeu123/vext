import { prisma } from '../config/prisma';
import { ApiError } from '../utils/helpers';

const toNum = (v: unknown): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export class ProductService {
  async list(teamId: number) {
    return prisma.product.findMany({
      where: { isActive: true, teamId },
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: number, teamId: number) {
    const product = await prisma.product.findFirst({ where: { id, teamId } });
    if (!product) throw ApiError.notFound('Produto não encontrado');
    return product;
  }

  async create(data: { name: string; price: number; description?: string }, teamId: number) {
    return prisma.product.create({ data: { ...data, teamId } });
  }

  async update(id: number, data: Record<string, any>, teamId: number) {
    await this.getById(id, teamId);
    return prisma.product.update({ where: { id }, data });
  }

  async delete(id: number, teamId: number) {
    await this.getById(id, teamId);
    return prisma.product.update({ where: { id }, data: { isActive: false } });
  }

  /**
   * Stats de vendas por produto.
   * Para cada produto ativo retorna: total vendido (cards won), receita gerada, ticket médio.
   * Útil pra dashboard "produtos mais rentáveis".
   */
  async getStats(teamId: number) {
    const products = await prisma.product.findMany({
      where: { isActive: true, teamId },
      select: { id: true, name: true, price: true },
    });

    const wonCards = await prisma.card.findMany({
      where: { teamId, stage: 'won', productId: { not: null } },
      select: { productId: true, value: true, closedAt: true },
    });

    const stats = products.map(p => {
      const sales = wonCards.filter(c => c.productId === p.id);
      const revenue = sales.reduce((acc, c) => acc + toNum(c.value), 0);
      const lastSale = sales
        .map(c => c.closedAt)
        .filter((d): d is Date => !!d)
        .sort((a, b) => b.getTime() - a.getTime())[0];

      return {
        id: p.id,
        name: p.name,
        listPrice: toNum(p.price),
        salesCount: sales.length,
        totalRevenue: revenue,
        avgTicket: sales.length > 0 ? Math.round(revenue / sales.length) : 0,
        lastSaleAt: lastSale ?? null,
      };
    });

    // Ordena por receita descendente
    stats.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      products: stats,
      totalRevenue: stats.reduce((acc, s) => acc + s.totalRevenue, 0),
      totalSales: stats.reduce((acc, s) => acc + s.salesCount, 0),
    };
  }
}

export const productService = new ProductService();
