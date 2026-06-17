import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';
import { ApiError, calculateDealProbability } from '../utils/helpers';
import { cardEventService } from './card-event.service';
import type { CreateCardInput, UpdateCardInput } from '../models/schemas';

const STAGE_LABELS: Record<string, string> = {
  prospecting: 'Prospecção',
  qualification: 'Qualificação',
  presentation: 'Apresentação',
  negotiation: 'Negociação',
  won: 'Ganho',
  lost: 'Perdido',
};

const fmtMoney = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
};

export class CardService {
  async list(teamId: number, page = 1, limit = 50) {
    const where = { teamId };

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

  async getById(id: number, teamId: number) {
    const card = await prisma.card.findFirst({
      where: { id, teamId },
      include: {
        contact: { select: { id: true, name: true, company: true, email: true } },
        owner: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
        product: { select: { id: true, name: true, price: true } },
      },
    });
    if (!card) throw ApiError.notFound('Oportunidade não encontrada');
    return { ...card, tags: card.tags.map((dt) => dt.tag) };
  }

  async create(data: CreateCardInput, userId: number, userName: string, teamId: number) {
    const { tagIds, nextFollowUpDate, ...dealData } = data;
    const probability = calculateDealProbability({ stage: dealData.stage || 'prospecting' });

    // Transaction: o card e suas tags precisam nascer juntos. Se a criação das
    // tags falhar, o card não pode ficar órfão/sem vínculo — tudo é revertido.
    const card = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.card.create({
        data: {
          ...dealData,
          ownerId: userId,
          teamId,
          probability,
          nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        },
      });

      if (tagIds?.length) {
        await tx.cardTag.createMany({
          data: tagIds.map((tagId) => ({ cardId: created.id, tagId })),
        });
      }

      // AuditLog dentro da transação: ou o card+tags+auditoria existem, ou nada existe.
      await tx.auditLog.create({
        data: {
          entityType: 'card', entityId: created.id, action: 'Card Criado',
          userId, userName, teamId,
        },
      });

      return created;
    });

    // CardEvent fica FORA da transação de propósito: é log de timeline best-effort
    // (cardEventService.log já engole erros) e não deve reverter a criação do card.
    await cardEventService.log({
      cardId: card.id,
      type: 'created',
      toValue: STAGE_LABELS[card.stage] ?? card.stage,
      description: `Card "${card.title}" criado`,
      userId,
      userName,
    });
    return this.getById(card.id, teamId);
  }

  async update(id: number, data: UpdateCardInput, userId: number, userName: string, teamId: number) {
    const existing = await this.getById(id, teamId);
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

    // Transaction: a atualização do card, o re-sync de tags e o registro de
    // auditoria formam uma unidade. Sem isso, um erro no meio poderia deixar o
    // card atualizado mas com as tags antigas apagadas (estado inconsistente).
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.card.update({
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
        await tx.cardTag.deleteMany({ where: { cardId: id } });
        if (tagIds.length > 0) {
          await tx.cardTag.createMany({
            data: tagIds.map((tagId) => ({ cardId: id, tagId })),
          });
        }
      }

      await tx.auditLog.create({
        data: {
          entityType: 'card', entityId: id, action: 'Card Atualizado',
          userId, userName, reason: reason ?? null, teamId,
        },
      });
    });

    // Eventos estruturados pra timeline — granulares por tipo de mudança
    if (updateData.stage && updateData.stage !== existing.stage) {
      let type: 'stage_changed' | 'closed_won' | 'closed_lost' = 'stage_changed';
      if (updateData.stage === 'won') type = 'closed_won';
      else if (updateData.stage === 'lost') type = 'closed_lost';

      await cardEventService.log({
        cardId: id,
        type,
        fromValue: STAGE_LABELS[existing.stage] ?? existing.stage,
        toValue: STAGE_LABELS[updateData.stage] ?? updateData.stage,
        description: reason ?? null,
        userId, userName,
      });
    }

    if (updateData.value !== undefined && Number(updateData.value) !== Number(existing.value)) {
      await cardEventService.log({
        cardId: id,
        type: 'value_changed',
        fromValue: fmtMoney(existing.value),
        toValue: fmtMoney(updateData.value),
        userId, userName,
      });
    }

    if (updateData.contactId !== undefined && updateData.contactId !== existing.contactId) {
      await cardEventService.log({
        cardId: id,
        type: 'contact_changed',
        fromValue: existing.contact?.name ?? String(existing.contactId),
        toValue: String(updateData.contactId),
        userId, userName,
      });
    }

    if (tagIds !== undefined) {
      const oldIds = existing.tags.map(t => t.id).sort();
      const newIds = [...tagIds].sort();
      const changed = oldIds.length !== newIds.length || oldIds.some((id, i) => id !== newIds[i]);
      if (changed) {
        await cardEventService.log({
          cardId: id,
          type: 'tags_changed',
          metadata: { from: oldIds, to: newIds },
          userId, userName,
        });
      }
    }

    if (updateData.notes && updateData.notes !== existing.notes) {
      await cardEventService.log({
        cardId: id,
        type: 'note_added',
        description: updateData.notes.slice(0, 200),
        userId, userName,
      });
    }

    return this.getById(id, teamId);
  }

  async delete(id: number, userId: number, userName: string, teamId: number) {
    await this.getById(id, teamId);
    // Transaction: auditoria + remoção de vínculos + remoção do card são atômicos.
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.auditLog.create({
        data: {
          entityType: 'card', entityId: id, action: 'Card Deletado',
          userId, userName, teamId,
        },
      });
      await tx.cardTag.deleteMany({ where: { cardId: id } });
      await tx.card.delete({ where: { id } });
      // CardEvent é deletado em cascade via FK
    });
  }

  async getStats(teamId: number) {
    const where = { teamId };
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
  }
}

export const cardService = new CardService();
