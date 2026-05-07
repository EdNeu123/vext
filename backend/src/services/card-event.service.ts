import { prisma } from '../config/prisma';
import type { CardEventType } from '@prisma/client';

interface LogEventInput {
  cardId: number;
  type: CardEventType;
  fromValue?: string | null;
  toValue?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  userId: number;
  userName: string;
}

/**
 * Service de eventos de card — log estruturado, separado do AuditLog genérico.
 * Cada mudança em um card gera um evento que aparece na timeline do card.
 */
export class CardEventService {
  /**
   * Registra um evento. Falhas aqui NÃO devem quebrar a operação principal —
   * sempre chamado em try/catch silencioso pelas mutations do CardService.
   */
  async log(input: LogEventInput) {
    try {
      await prisma.cardEvent.create({
        data: {
          cardId: input.cardId,
          type: input.type,
          fromValue: input.fromValue ?? null,
          toValue: input.toValue ?? null,
          description: input.description ?? null,
          metadata: (input.metadata as any) ?? undefined,
          userId: input.userId,
          userName: input.userName,
        },
      });
    } catch (err) {
      // Loga, mas não rethrow — perder um evento não pode derrubar uma update.
      // eslint-disable-next-line no-console
      console.error('[CardEventService.log] falhou (silencioso):', err);
    }
  }

  /**
   * Lista eventos de um card, mais novos primeiro.
   */
  async listByCard(cardId: number, limit = 100) {
    return prisma.cardEvent.findMany({
      where: { cardId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const cardEventService = new CardEventService();
