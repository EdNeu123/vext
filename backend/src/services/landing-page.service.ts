import { prisma } from '../config/database';
import { ApiError } from '../utils/helpers';
import { auditService } from './audit.service';

export class LandingPageService {
  async list(userId: number, role: string) {
    const where = role !== 'admin' ? { ownerId: userId } : {};
    return prisma.landingPage.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getById(id: number) {
    const page = await prisma.landingPage.findUnique({ where: { id } });
    if (!page) throw ApiError.notFound('Landing Page não encontrada');
    return page;
  }

  async getBySlug(slug: string) {
    const page = await prisma.landingPage.findUnique({ where: { slug } });
    if (!page || !page.isActive) throw ApiError.notFound('Página não encontrada');
    await prisma.landingPage.update({ where: { id: page.id }, data: { views: { increment: 1 } } });
    return page;
  }

  async create(data: any, ownerId: number, userName: string) {
    const existing = await prisma.landingPage.findUnique({ where: { slug: data.slug } });
    if (existing) throw ApiError.conflict('Este slug já está em uso');

    const page = await prisma.landingPage.create({ data: { ...data, ownerId } });
    await auditService.log('landing_page', page.id, 'Landing Page Criada', ownerId, userName);
    return page;
  }

  async update(id: number, data: any, userId: number, userName: string) {
    if (data.slug) {
      const existing = await prisma.landingPage.findUnique({ where: { slug: data.slug } });
      if (existing && existing.id !== id) throw ApiError.conflict('Slug em uso');
    }

    const page = await prisma.landingPage.update({ where: { id }, data });
    await auditService.log('landing_page', id, 'Landing Page Atualizada', userId, userName);
    return page;
  }

  async delete(id: number, userId: number, userName: string) {
    await auditService.log('landing_page', id, 'Landing Page Deletada', userId, userName);
    await prisma.landingPage.delete({ where: { id } });
  }

  async recordConversion(slug: string) {
    const page = await prisma.landingPage.findUnique({ where: { slug } });
    if (page) {
      await prisma.landingPage.update({ where: { id: page.id }, data: { conversions: { increment: 1 } } });
    }
  }
}

export const landingPageService = new LandingPageService();
