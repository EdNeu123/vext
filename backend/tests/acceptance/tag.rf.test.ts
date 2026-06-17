/**
 * Testes de aceitação — Tags.
 *   RF-0017 Registro de Tag
 *   RF-0018 Consulta de Tag (usageCount)
 *   RF-0019 Listagem de Tags
 *   RF-0020 Alteração de Tag
 *   RF-0021 Deleção de Tag (soft/hard)
 */
import { describe, it, expect } from 'vitest';
import { prismaMock } from '../helpers/prismaMock';
import { tagService } from '../../src/services/tag.service';

const TEAM = 1;

describe('RF-0017 — Registro de Tag', () => {
  it('CA3: tag é criada (isActive=true é default do schema do banco)', async () => {
    (prismaMock.tag.findUnique as any).mockResolvedValue(null);
    (prismaMock.tag.create as any).mockResolvedValue({ id: 1, label: 'VIP', color: '#3b82f6', isActive: true });

    const result = await tagService.create({ label: 'VIP', color: '#3b82f6' }, TEAM);

    expect(result).toMatchObject({ label: 'VIP' });
    // isActive não é forçado no input — vem do default do Prisma (@default(true))
    const arg = (prismaMock.tag.create as any).mock.calls[0][0];
    expect(arg.data).not.toHaveProperty('isActive');
  });

  it('CA1/CA4: nome duplicado na equipe retorna 409', async () => {
    (prismaMock.tag.findUnique as any).mockResolvedValue({ id: 2, label: 'VIP' });
    await expect(tagService.create({ label: 'VIP', color: '#000000' }, TEAM))
      .rejects.toMatchObject({ statusCode: 409 });
    expect(prismaMock.tag.create).not.toHaveBeenCalled();
  });
});

describe('RF-0018 — Consulta de Tag', () => {
  it('CA2: usageCount reflete o número exato de cards que usam a tag', async () => {
    (prismaMock.tag.findFirst as any).mockResolvedValue({ id: 5, label: 'Quente', teamId: TEAM });
    (prismaMock.cardTag.findMany as any).mockResolvedValue([
      { card: { id: 1 } }, { card: { id: 2 } }, { card: { id: 3 } },
    ]);

    const result = await tagService.getUsage(5, TEAM);

    expect(result?.totalUsage).toBe(3);
  });

  it('CA1: tag inexistente na equipe → null (404 no controller)', async () => {
    (prismaMock.tag.findFirst as any).mockResolvedValue(null);
    expect(await tagService.getUsage(99, TEAM)).toBeNull();
  });
});

describe('RF-0019 — Listagem de Tags', () => {
  it('CA1: por padrão retorna apenas ativas (where.isActive=true)', async () => {
    (prismaMock.tag.findMany as any).mockResolvedValue([]);
    await tagService.list(TEAM);
    const arg = (prismaMock.tag.findMany as any).mock.calls[0][0];
    expect(arg.where).toEqual({ teamId: TEAM, isActive: true });
  });

  it('CA2: includeInactive=true retorna todas (sem filtro de status)', async () => {
    (prismaMock.tag.findMany as any).mockResolvedValue([]);
    await tagService.list(TEAM, true);
    const arg = (prismaMock.tag.findMany as any).mock.calls[0][0];
    expect(arg.where).toEqual({ teamId: TEAM });
  });

  it('CA3: ordena ativas antes de inativas, e por label alfabético', async () => {
    (prismaMock.tag.findMany as any).mockResolvedValue([]);
    await tagService.list(TEAM, true);
    const arg = (prismaMock.tag.findMany as any).mock.calls[0][0];
    expect(arg.orderBy).toEqual([{ isActive: 'desc' }, { label: 'asc' }]);
  });
});

describe('RF-0020 — Alteração de Tag', () => {
  it('CA2: tag inexistente → 404', async () => {
    (prismaMock.tag.findFirst as any).mockResolvedValue(null);
    await expect(tagService.update(9, { label: 'X' }, TEAM)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('atualiza label quando a tag pertence à equipe', async () => {
    (prismaMock.tag.findFirst as any).mockResolvedValue({ id: 3, teamId: TEAM });
    (prismaMock.tag.update as any).mockResolvedValue({ id: 3, label: 'Nova' });
    const r = await tagService.update(3, { label: 'Nova' }, TEAM);
    expect(r).toMatchObject({ label: 'Nova' });
  });
});

describe('RF-0021 — Deleção de Tag', () => {
  it('CA1: tag EM USO é apenas inativada (soft-delete), nunca removida', async () => {
    (prismaMock.tag.findFirst as any).mockResolvedValue({ id: 7, teamId: TEAM });
    (prismaMock.cardTag.count as any).mockResolvedValue(4); // em uso
    (prismaMock.tag.update as any).mockResolvedValue({ id: 7, isActive: false });

    const result = await tagService.delete(7, TEAM, true); // mesmo com force

    expect(result).toMatchObject({ hardDeleted: false, deactivated: true, usageCount: 4 });
    expect(prismaMock.tag.delete).not.toHaveBeenCalled();
    expect(prismaMock.tag.update).toHaveBeenCalledWith({ where: { id: 7 }, data: { isActive: false } });
  });

  it('CA2: tag SEM uso + force=true é removida permanentemente', async () => {
    (prismaMock.tag.findFirst as any).mockResolvedValue({ id: 8, teamId: TEAM });
    (prismaMock.cardTag.count as any).mockResolvedValue(0); // sem uso
    (prismaMock.tag.delete as any).mockResolvedValue({ id: 8 });

    const result = await tagService.delete(8, TEAM, true);

    expect(result).toMatchObject({ hardDeleted: true });
    expect(prismaMock.tag.delete).toHaveBeenCalledWith({ where: { id: 8 } });
  });

  it('CA3: sem force, mesmo sem uso, faz soft-delete e informa o tipo', async () => {
    (prismaMock.tag.findFirst as any).mockResolvedValue({ id: 9, teamId: TEAM });
    (prismaMock.cardTag.count as any).mockResolvedValue(0);
    (prismaMock.tag.update as any).mockResolvedValue({ id: 9, isActive: false });

    const result = await tagService.delete(9, TEAM, false);

    expect(result).toMatchObject({ hardDeleted: false, deactivated: true });
  });
});
