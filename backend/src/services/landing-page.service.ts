import { prisma } from '../config/prisma';
import { ApiError } from '../utils/helpers';
import { auditService } from './audit.service';

export class LandingPageService {
  async list(teamId: number) {
    return prisma.landingPage.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { id: true, name: true, price: true } } },
    });
  }

  async getById(id: number, teamId: number) {
    const page = await prisma.landingPage.findFirst({
      where: { id, teamId },
      include: { product: { select: { id: true, name: true, price: true } } },
    });
    if (!page) throw ApiError.notFound('Landing Page não encontrada');
    return page;
  }

  /** Página pública — slug é globalmente único, sem escopo de equipe */
  async getBySlug(slug: string) {
    const page = await prisma.landingPage.findUnique({
      where: { slug },
      include: { product: { select: { id: true, name: true, price: true } } },
    });
    if (!page || !page.isActive) throw ApiError.notFound('Página não encontrada');
    await prisma.landingPage.update({ where: { id: page.id }, data: { views: { increment: 1 } } });
    return page;
  }

  async create(data: any, ownerId: number, userName: string, teamId: number) {
    const existing = await prisma.landingPage.findUnique({ where: { slug: data.slug } });
    if (existing) throw ApiError.conflict('Este slug já está em uso');

    const page = await prisma.landingPage.create({ data: { ...data, ownerId, teamId } });
    await auditService.log('landing_page', page.id, 'Landing Page Criada', ownerId, userName, undefined, undefined, teamId);
    return page;
  }

  async update(id: number, data: any, userId: number, userName: string, teamId: number) {
    await this.getById(id, teamId);

    if (data.slug) {
      const existing = await prisma.landingPage.findUnique({ where: { slug: data.slug } });
      if (existing && existing.id !== id) throw ApiError.conflict('Slug em uso');
    }

    const page = await prisma.landingPage.update({ where: { id }, data });
    await auditService.log('landing_page', id, 'Landing Page Atualizada', userId, userName, undefined, undefined, teamId);
    return page;
  }

  async delete(id: number, userId: number, userName: string, teamId: number) {
    await this.getById(id, teamId);
    await auditService.log('landing_page', id, 'Landing Page Deletada', userId, userName, undefined, undefined, teamId);
    await prisma.landingPage.delete({ where: { id } });
  }

  /** Conversão registrada a partir da página pública — sem escopo de equipe */
  async recordConversion(slug: string) {
    const page = await prisma.landingPage.findUnique({
      where: { slug },
      include: { product: { select: { id: true, name: true, price: true } } },
    });
    if (page) {
      await prisma.landingPage.update({ where: { id: page.id }, data: { conversions: { increment: 1 } } });
    }
  }
}

export const landingPageService = new LandingPageService();
