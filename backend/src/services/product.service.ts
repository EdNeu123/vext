import { prisma } from '../config/prisma';
import { ApiError } from '../utils/helpers';

export class ProductService {
  async list() {
    return prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: number) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw ApiError.notFound('Produto não encontrado');
    return product;
  }

  async create(data: { name: string; price: number; description?: string }) {
    return prisma.product.create({ data });
  }

  async update(id: number, data: Record<string, any>) {
    await this.getById(id);
    return prisma.product.update({ where: { id }, data });
  }

  async delete(id: number) {
    await this.getById(id);
    return prisma.product.update({ where: { id }, data: { isActive: false } });
  }
}

export const productService = new ProductService();
