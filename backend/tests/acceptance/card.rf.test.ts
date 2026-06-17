/**
 * Testes de aceitação — Cards / Pipeline (Kanban).
 *   RF-0032 Registro de Card
 *   RF-0033 Consulta de Card
 *   RF-0035 Alteração de Card (eventos stage_changed / value_changed)
 *   RF-0036 Deleção de Card (cascade)
 *   RF-0037 Movimentação de Card no Kanban (closedAt, fromValue/toValue)
 *
 * Os eventos de histórico são emitidos via cardEventService.log — espionamos
 * essa função para asserir o tipo de evento e os valores from/to.
 */
import { describe, it, expect, vi } from 'vitest';
import { prismaMock } from '../helpers/prismaMock';
import { cardService } from '../../src/services/card.service';
import { cardEventService } from '../../src/services/card-event.service';

const TEAM = 1;
const USER = 10;
const NAME = 'Edu';

function hydrate(card: any) {
  return { ...card, tags: (card.tags ?? []).map((t: any) => ({ tag: t })) };
}

describe('RF-0032 — Registro de Card', () => {
  it('CA3: probabilidade é calculada automaticamente a partir do estágio', async () => {
    (prismaMock.card.create as any).mockResolvedValue({ id: 1, title: 'Deal', stage: 'qualification', teamId: TEAM });
    (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });
    (prismaMock.card.findFirst as any).mockResolvedValue(hydrate({ id: 1, title: 'Deal', stage: 'qualification', teamId: TEAM, tags: [] }));

    await cardService.create({ title: 'Deal', value: 1000, contactId: 1, stage: 'qualification' } as any, USER, NAME, TEAM);

    const arg = (prismaMock.card.create as any).mock.calls[0][0];
    expect(arg.data.probability).toBe(25); // qualification = 25
  });

  it('CA4: evento "created" é registrado no histórico do card', async () => {
    const spy = vi.spyOn(cardEventService, 'log').mockResolvedValue(undefined as any);
    (prismaMock.card.create as any).mockResolvedValue({ id: 2, title: 'Novo', stage: 'prospecting', teamId: TEAM });
    (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });
    (prismaMock.card.findFirst as any).mockResolvedValue(hydrate({ id: 2, title: 'Novo', stage: 'prospecting', teamId: TEAM, tags: [] }));

    await cardService.create({ title: 'Novo', value: 500, contactId: 1, stage: 'prospecting' } as any, USER, NAME, TEAM);

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ cardId: 2, type: 'created' }));
    spy.mockRestore();
  });
});

describe('RF-0033 — Consulta de Card', () => {
  it('CA1: card inexistente na equipe → 404', async () => {
    (prismaMock.card.findFirst as any).mockResolvedValue(null);
    await expect(cardService.getById(99, TEAM)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('RF-0035 — Alteração de Card', () => {
  it('CA1: mudança de estágio gera evento stage_changed com from/to', async () => {
    const spy = vi.spyOn(cardEventService, 'log').mockResolvedValue(undefined as any);
    (prismaMock.card.findFirst as any)
      .mockResolvedValueOnce(hydrate({ id: 3, stage: 'prospecting', value: 100, contactId: 1, contact: { name: 'C' }, tags: [] }))
      .mockResolvedValueOnce(hydrate({ id: 3, stage: 'qualification', teamId: TEAM, contact: { name: 'C' }, tags: [] }));
    (prismaMock.card.update as any).mockResolvedValue({ id: 3 });
    (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

    await cardService.update(3, { stage: 'qualification' } as any, USER, NAME, TEAM);

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'stage_changed', fromValue: 'Prospecção', toValue: 'Qualificação',
    }));
    spy.mockRestore();
  });

  it('CA2: mudança de valor gera evento value_changed', async () => {
    const spy = vi.spyOn(cardEventService, 'log').mockResolvedValue(undefined as any);
    (prismaMock.card.findFirst as any)
      .mockResolvedValueOnce(hydrate({ id: 4, stage: 'prospecting', value: 100, contactId: 1, contact: { name: 'C' }, tags: [] }))
      .mockResolvedValueOnce(hydrate({ id: 4, stage: 'prospecting', teamId: TEAM, contact: { name: 'C' }, tags: [] }));
    (prismaMock.card.update as any).mockResolvedValue({ id: 4 });
    (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

    await cardService.update(4, { value: 250 } as any, USER, NAME, TEAM);

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'value_changed', fromValue: '100.00', toValue: '250.00',
    }));
    spy.mockRestore();
  });

  it('CA4: card inexistente → 404 (guard antes de qualquer escrita)', async () => {
    (prismaMock.card.findFirst as any).mockResolvedValue(null);
    await expect(cardService.update(99, { stage: 'won' } as any, USER, NAME, TEAM))
      .rejects.toMatchObject({ statusCode: 404 });
    expect(prismaMock.card.update).not.toHaveBeenCalled();
  });
});

describe('RF-0037 — Movimentação de Card no Kanban', () => {
  it('CA3: ao mover para "won", closedAt é preenchido automaticamente', async () => {
    vi.spyOn(cardEventService, 'log').mockResolvedValue(undefined as any);
    (prismaMock.card.findFirst as any)
      .mockResolvedValueOnce(hydrate({ id: 5, stage: 'negotiation', value: 100, contactId: 1, closedAt: null, contact: { name: 'C' }, tags: [] }))
      .mockResolvedValueOnce(hydrate({ id: 5, stage: 'won', teamId: TEAM, contact: { name: 'C' }, tags: [] }));
    (prismaMock.card.update as any).mockResolvedValue({ id: 5 });
    (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

    await cardService.update(5, { stage: 'won' } as any, USER, NAME, TEAM);

    const arg = (prismaMock.card.update as any).mock.calls[0][0];
    expect(arg.data.closedAt).toBeInstanceOf(Date);
  });

  it('CA2: mover para "won" gera evento closed_won (subtipo de stage_changed)', async () => {
    const spy = vi.spyOn(cardEventService, 'log').mockResolvedValue(undefined as any);
    (prismaMock.card.findFirst as any)
      .mockResolvedValueOnce(hydrate({ id: 6, stage: 'negotiation', value: 100, contactId: 1, closedAt: null, contact: { name: 'C' }, tags: [] }))
      .mockResolvedValueOnce(hydrate({ id: 6, stage: 'won', teamId: TEAM, contact: { name: 'C' }, tags: [] }));
    (prismaMock.card.update as any).mockResolvedValue({ id: 6 });
    (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

    await cardService.update(6, { stage: 'won' } as any, USER, NAME, TEAM);

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'closed_won', toValue: 'Ganho',
    }));
    spy.mockRestore();
  });
});
