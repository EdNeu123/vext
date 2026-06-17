/**
 * Testes unitários — CardService (entidade `cards`).
 *
 * POST, UPDATE, GET ALL (paginado), GET. DB mockado.
 * Valida também o uso de TRANSACTION: as escritas (card + cardTag + auditLog)
 * passam pelo $transaction mockado, que executa o callback com o próprio mock
 * como `tx`. Conferimos que tx.auditLog.create e tx.cardTag são chamados dentro.
 */
import { describe, it, expect, vi } from 'vitest';
import { prismaMock } from '../helpers/prismaMock';
import { cardService } from '../../src/services/card.service';

const TEAM = 1;
const USER = 10;
const USERNAME = 'Edu';

// getById faz um findFirst com include; padronizamos o retorno "hidratado".
function mockCardFindFirst(card: any) {
  (prismaMock.card.findFirst as any).mockResolvedValue(
    card ? { ...card, tags: (card.tags ?? []).map((t: any) => ({ tag: t })) } : null,
  );
}

describe('CardService', () => {
  describe('GET ALL (list)', () => {
    it('retorna data (tags achatadas) + total, escopado por equipe e paginado', async () => {
      (prismaMock.card.findMany as any).mockResolvedValue([
        { id: 1, title: 'Deal', teamId: TEAM, tags: [{ tag: { id: 5, label: 'VIP' } }] },
      ]);
      (prismaMock.card.count as any).mockResolvedValue(1);

      const result = await cardService.list(TEAM, 1, 50);

      expect(result.total).toBe(1);
      expect(result.data[0].tags).toEqual([{ id: 5, label: 'VIP' }]); // achatado
      const arg = (prismaMock.card.findMany as any).mock.calls[0][0];
      expect(arg.where).toEqual({ teamId: TEAM });
      expect(arg.skip).toBe(0);
      expect(arg.take).toBe(50);
    });
  });

  describe('GET (getById)', () => {
    it('retorna card da equipe com tags achatadas', async () => {
      mockCardFindFirst({ id: 3, title: 'X', teamId: TEAM, tags: [{ id: 9, label: 'Quente' }] });

      const result = await cardService.getById(3, TEAM);

      expect(result.id).toBe(3);
      expect(result.tags).toEqual([{ id: 9, label: 'Quente' }]);
      const arg = (prismaMock.card.findFirst as any).mock.calls[0][0];
      expect(arg.where).toEqual({ id: 3, teamId: TEAM });
    });

    it('lança 404 quando não pertence à equipe', async () => {
      mockCardFindFirst(null);
      await expect(cardService.getById(3, TEAM)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('POST (create) — transação', () => {
    it('cria card, vincula tags e grava auditoria dentro da transação', async () => {
      (prismaMock.card.create as any).mockResolvedValue({ id: 20, title: 'Novo', stage: 'prospecting', teamId: TEAM });
      (prismaMock.cardTag.createMany as any).mockResolvedValue({ count: 2 });
      (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });
      // getById final
      mockCardFindFirst({ id: 20, title: 'Novo', stage: 'prospecting', teamId: TEAM, tags: [] });

      const result = await cardService.create(
        { title: 'Novo', value: 1000, contactId: 1, stage: 'prospecting', tagIds: [5, 6] } as any,
        USER, USERNAME, TEAM,
      );

      expect(result.id).toBe(20);
      // passou pela transação
      expect(prismaMock.$transaction).toHaveBeenCalled();
      // card criado com ownerId/teamId/probabilidade
      const createArg = (prismaMock.card.create as any).mock.calls[0][0];
      expect(createArg.data).toMatchObject({ ownerId: USER, teamId: TEAM, title: 'Novo' });
      expect(createArg.data.probability).toBe(10); // prospecting
      // tags vinculadas
      expect(prismaMock.cardTag.createMany).toHaveBeenCalledWith({
        data: [{ cardId: 20, tagId: 5 }, { cardId: 20, tagId: 6 }],
      });
      // auditoria gravada dentro da transação
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ entityType: 'card', entityId: 20, action: 'Card Criado', teamId: TEAM }),
      });
    });

    it('não chama cardTag.createMany quando não há tagIds', async () => {
      (prismaMock.card.create as any).mockResolvedValue({ id: 21, title: 'Sem tags', stage: 'prospecting', teamId: TEAM });
      (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });
      mockCardFindFirst({ id: 21, title: 'Sem tags', stage: 'prospecting', teamId: TEAM, tags: [] });

      await cardService.create(
        { title: 'Sem tags', value: 500, contactId: 1, stage: 'prospecting' } as any,
        USER, USERNAME, TEAM,
      );

      expect(prismaMock.cardTag.createMany).not.toHaveBeenCalled();
    });
  });

  describe('UPDATE (update) — transação', () => {
    it('atualiza card, re-sincroniza tags e grava auditoria', async () => {
      // 1ª chamada de getById (existing) + 2ª (retorno final)
      (prismaMock.card.findFirst as any)
        .mockResolvedValueOnce({ id: 30, stage: 'prospecting', value: 100, contactId: 1, budgetConfirmed: false, decisionMakerIdentified: false, painPoints: null, timeline: null, notes: null, closedAt: null, contact: { name: 'C' }, tags: [] })
        .mockResolvedValueOnce({ id: 30, stage: 'qualification', teamId: TEAM, tags: [], contact: { name: 'C' } });
      (prismaMock.card.update as any).mockResolvedValue({ id: 30 });
      (prismaMock.cardTag.deleteMany as any).mockResolvedValue({ count: 0 });
      (prismaMock.cardTag.createMany as any).mockResolvedValue({ count: 1 });
      (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

      await cardService.update(30, { stage: 'qualification', tagIds: [7] } as any, USER, USERNAME, TEAM);

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(prismaMock.card.update).toHaveBeenCalled();
      // re-sync de tags: apaga as antigas e cria as novas
      expect(prismaMock.cardTag.deleteMany).toHaveBeenCalledWith({ where: { cardId: 30 } });
      expect(prismaMock.cardTag.createMany).toHaveBeenCalledWith({ data: [{ cardId: 30, tagId: 7 }] });
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ entityType: 'card', entityId: 30, action: 'Card Atualizado' }),
      });
    });

    it('bloqueia update de card fora da equipe (404 no guard)', async () => {
      (prismaMock.card.findFirst as any).mockResolvedValue(null);
      await expect(cardService.update(30, { stage: 'won' } as any, USER, USERNAME, TEAM))
        .rejects.toMatchObject({ statusCode: 404 });
      expect(prismaMock.card.update).not.toHaveBeenCalled();
    });
  });
});
