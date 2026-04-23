import { prisma } from '../config/prisma';
import { ApiError, calculateDealProbability } from '../utils/helpers';
import { auditService } from './audit.service';
import type { CreateCardInput, UpdateCardInput } from '../models/schemas';

export class CardService {
  async list(userId: number, role: string, page = 1, limit = 50) {
    const where = role !== 'admin' ? { ownerId: userId } : {};

    const [rawDeals, total] = await Promise.all([
      prisma.card.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          contact: { select: { id: true, name: true, company: true } },
          owner: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
          product: { select: { id: true, name: true, price: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.card.count({ where }),
    ]);

    const data = rawDeals.map((card) => ({
      ...card,
      tags: card.tags.map((dt) => dt.tag),
    }));

    return { data, total };
  }

  async getById(id: number, requesterId?: number, requesterRole?: string) {
    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        contact: { select: { id: true, name: true, company: true, email: true } },
        owner: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
        product: { select: { id: true, name: true, price: true } },
      },
    });
    if (!card) throw ApiError.notFound('Oportunidade não encontrada');
    if (requesterId && requesterRole !== 'admin' && card.ownerId !== requesterId) {
      throw ApiError.forbidden('Acesso negado');
    }
    return { ...card, tags: card.tags.map((dt) => dt.tag) };
  }

  async create(data: CreateCardInput, userId: number, userName: string) {
    const { tagIds, nextFollowUpDate, ...dealData } = data;
    const probability = calculateDealProbability({ stage: dealData.stage || 'prospecting' });

    const card = await prisma.card.create({
      data: {
        ...dealData,
        ownerId: userId,
        probability,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
      },
    });

    if (tagIds?.length) {
      await prisma.cardTag.createMany({
        data: tagIds.map((tagId) => ({ cardId: card.id, tagId })),
      });
    }

    await auditService.log('card', card.id, 'Card Criado', userId, userName);
    return this.getById(card.id);
  }

  async update(id: number, data: UpdateCardInput, userId: number, userName: string, userRole: string) {
    const existing = await this.getById(id, userId, userRole);
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

    await prisma.card.update({
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
      await prisma.cardTag.deleteMany({ where: { cardId: id } });
      if (tagIds.length > 0) {
        await prisma.cardTag.createMany({
          data: tagIds.map((tagId) => ({ cardId: id, tagId })),
        });
      }
    }

    await auditService.log('card', id, 'Card Atualizado', userId, userName, undefined, reason);
    return this.getById(id);
  }

  async delete(id: number, userId: number, userName: string, userRole: string) {
    await this.getById(id, userId, userRole);
    await auditService.log('card', id, 'Card Deletado', userId, userName);
    await prisma.cardTag.deleteMany({ where: { cardId: id } });
    await prisma.card.delete({ where: { id } });
  }

  async getStats(userId: number, role: string) {
    try {
      const where = role !== 'admin' ? { ownerId: userId } : {};
      const cardsRaw = await prisma.card.findMany({
        where,
        select: { stage: true, value: true },
      });

      type CardSlice = { stage: string; value: unknown };
      const cards = cardsRaw as CardSlice[];

      const toNum = (v: unknown): number => {
        const n = Number(v ?? 0);
        return Number.isFinite(n) ? n : 0;
      };
      const sum = (arr: CardSlice[]): number =>
        arr.reduce((acc: number, d: CardSlice) => acc + toNum(d.value), 0);

      const won = cards.filter((d: CardSlice) => d.stage === 'won');
      const lost = cards.filter((d: CardSlice) => d.stage === 'lost');
      const active = cards.filter((d: CardSlice) => !['won', 'lost'].includes(d.stage));
      const closed = won.length + lost.length;

      const byStage = ['prospecting', 'qualification', 'presentation', 'negotiation'].map((stage: string) => {
        const stageDeals = active.filter((d: CardSlice) => d.stage === stage);
        return {
          stage,
          count: stageDeals.length,
          value: sum(stageDeals),
        };
      });

      const isEmpty = cards.length === 0;

      return {
        totalPipeline: sum(active),
        wonDeals: sum(won),
        lostDeals: sum(lost),
        activeDeals: active.length,
        conversionRate: closed > 0 ? (won.length / closed) * 100 : 0,
        avgDealValue: won.length > 0 ? sum(won) / won.length : 0,
        byStage,
        isEmpty,
        emptyMessage: isEmpty
          ? 'Ainda não há cards cadastrados. Crie sua primeira oportunidade para ver estatísticas.'
          : null,
      };
    } catch (error) {
      // Log estruturado — Vercel Runtime Logs mostram isso
      // eslint-disable-next-line no-console
      console.error('[CardService.getStats] erro:', {
        userId, role,
        error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
      });
      throw error;
    }
  }
}

export const cardService = new CardService();
