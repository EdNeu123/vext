import { prisma } from '../config/database';
import { ApiError, calculateDealProbability } from '../utils/helpers';
import { auditService } from './audit.service';
import type { CreateDealInput, UpdateDealInput } from '../models/schemas';

export class DealService {
  async list(userId: number, role: string, page = 1, limit = 50) {
    const where = role !== 'admin' ? { ownerId: userId } : {};

    const [rawDeals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          contact: { select: { id: true, name: true, company: true } },
          owner: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.deal.count({ where }),
    ]);

    const data = rawDeals.map((deal) => ({
      ...deal,
      tags: deal.tags.map((dt) => dt.tag),
    }));

    return { data, total };
  }

  async getById(id: number) {
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        contact: { select: { id: true, name: true, company: true, email: true } },
        owner: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
      },
    });
    if (!deal) throw ApiError.notFound('Oportunidade não encontrada');
    return { ...deal, tags: deal.tags.map((dt) => dt.tag) };
  }

  async create(data: CreateDealInput, userId: number, userName: string) {
    const { tagIds, nextFollowUpDate, ...dealData } = data;
    const probability = calculateDealProbability({ stage: dealData.stage || 'prospecting' });

    const deal = await prisma.deal.create({
      data: {
        ...dealData,
        ownerId: userId,
        probability,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
      },
    });

    if (tagIds?.length) {
      await prisma.dealTag.createMany({
        data: tagIds.map((tagId) => ({ dealId: deal.id, tagId })),
      });
    }

    await auditService.log('deal', deal.id, 'Deal Criado', userId, userName);
    return this.getById(deal.id);
  }

  async update(id: number, data: UpdateDealInput, userId: number, userName: string) {
    const existing = await this.getById(id);
    const { tagIds, reason, nextFollowUpDate, ...updateData } = data;

    const probability = calculateDealProbability({
      stage: updateData.stage || existing.stage,
      budgetConfirmed: updateData.budgetConfirmed ?? existing.budgetConfirmed,
      decisionMakerIdentified: updateData.decisionMakerIdentified ?? existing.decisionMakerIdentified,
      painPoints: updateData.painPoints ?? existing.painPoints,
      timeline: updateData.timeline ?? existing.timeline,
    });

    let closedAt = existing.closedAt;
    if (updateData.stage === 'won' || updateData.stage === 'lost') {
      closedAt = new Date();
    }

    await prisma.deal.update({
      where: { id },
      data: {
        ...updateData,
        probability,
        closedAt,
        nextFollowUpDate: nextFollowUpDate !== undefined
          ? (nextFollowUpDate ? new Date(nextFollowUpDate) : null)
          : undefined,
      },
    });

    if (tagIds !== undefined) {
      await prisma.dealTag.deleteMany({ where: { dealId: id } });
      if (tagIds.length > 0) {
        await prisma.dealTag.createMany({
          data: tagIds.map((tagId) => ({ dealId: id, tagId })),
        });
      }
    }

    await auditService.log('deal', id, 'Deal Atualizado', userId, userName, undefined, reason);
    return this.getById(id);
  }

  async delete(id: number, userId: number, userName: string) {
    await this.getById(id);
    await auditService.log('deal', id, 'Deal Deletado', userId, userName);
    await prisma.dealTag.deleteMany({ where: { dealId: id } });
    await prisma.deal.delete({ where: { id } });
  }

  async getStats(userId: number, role: string) {
    const where = role !== 'admin' ? { ownerId: userId } : {};
    const deals = await prisma.deal.findMany({ where });

    const toNum = (v: any) => Number(v || 0);
    const won = deals.filter((d) => d.stage === 'won');
    const lost = deals.filter((d) => d.stage === 'lost');
    const active = deals.filter((d) => !['won', 'lost'].includes(d.stage));
    const closed = won.length + lost.length;

    const byStage = ['prospecting', 'qualification', 'presentation', 'negotiation'].map((stage) => {
      const stageDeals = active.filter((d) => d.stage === stage);
      return {
        stage,
        count: stageDeals.length,
        value: stageDeals.reduce((acc, d) => acc + toNum(d.value), 0),
      };
    });

    return {
      totalPipeline: active.reduce((acc, d) => acc + toNum(d.value), 0),
      wonDeals: won.reduce((acc, d) => acc + toNum(d.value), 0),
      lostDeals: lost.reduce((acc, d) => acc + toNum(d.value), 0),
      activeDeals: active.length,
      conversionRate: closed > 0 ? (won.length / closed) * 100 : 0,
      avgDealValue: won.length > 0 ? won.reduce((acc, d) => acc + toNum(d.value), 0) / won.length : 0,
      byStage,
    };
  }
}

export const dealService = new DealService();
