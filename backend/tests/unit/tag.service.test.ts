/**
 * Testes unitários — TagService (entidade `tags`).
 * POST (com checagem de label duplicado), UPDATE, GET ALL (com usageCount), GET (usage).
 */
import { describe, it, expect } from 'vitest';
import { prismaMock } from '../helpers/prismaMock';
import { tagService } from '../../src/services/tag.service';

const TEAM = 1;

describe('TagService', () => {
  describe('GET ALL (list)', () => {
    it('mapeia _count.cards para usageCount e retorna só ativas por padrão', async () => {
      (prismaMock.tag.findMany as any).mockResolvedValue([
        { id: 1, label: 'VIP', color: '#fff', isActive: true, createdAt: new Date(), _count: { cards: 3 } },
      ]);

      const result = await tagService.list(TEAM);

      expect(result[0]).toMatchObject({ id: 1, label: 'VIP', usageCount: 3 });
      const arg = (prismaMock.tag.findMany as any).mock.calls[0][0];
      expect(arg.where).toEqual({ teamId: TEAM, isActive: true });
    });

    it('includeInactive=true não filtra por isActive', async () => {
      (prismaMock.tag.findMany as any).mockResolvedValue([]);
      await tagService.list(TEAM, true);
      const arg = (prismaMock.tag.findMany as any).mock.calls[0][0];
      expect(arg.where).toEqual({ teamId: TEAM });
    });
  });

  describe('GET (getUsage)', () => {
    it('retorna tag + cards que a usam', async () => {
      (prismaMock.tag.findFirst as any).mockResolvedValue({ id: 2, label: 'Quente', teamId: TEAM });
      (prismaMock.cardTag.findMany as any).mockResolvedValue([
        { card: { id: 5, title: 'Deal', value: 100, stage: 'won', contact: null } },
      ]);

      const result = await tagService.getUsage(2, TEAM);

      expect(result?.totalUsage).toBe(1);
      expect(result?.cards).toHaveLength(1);
    });

    it('retorna null quando a tag não é da equipe', async () => {
      (prismaMock.tag.findFirst as any).mockResolvedValue(null);
      const result = await tagService.getUsage(2, TEAM);
      expect(result).toBeNull();
    });
  });

  describe('POST (create)', () => {
    it('cria tag quando label é único na equipe', async () => {
      (prismaMock.tag.findUnique as any).mockResolvedValue(null);
      const created = { id: 9, label: 'Novo', color: '#000', teamId: TEAM };
      (prismaMock.tag.create as any).mockResolvedValue(created);

      const result = await tagService.create({ label: 'Novo', color: '#000' }, TEAM);

      expect(result).toEqual(created);
      expect(prismaMock.tag.create).toHaveBeenCalledWith({ data: { label: 'Novo', color: '#000', teamId: TEAM } });
    });

    it('lança 409 quando já existe label igual na equipe', async () => {
      (prismaMock.tag.findUnique as any).mockResolvedValue({ id: 1, label: 'Novo' });

      await expect(tagService.create({ label: 'Novo', color: '#000' }, TEAM))
        .rejects.toMatchObject({ statusCode: 409 });
      expect(prismaMock.tag.create).not.toHaveBeenCalled();
    });
  });

  describe('UPDATE (update)', () => {
    it('valida posse e atualiza', async () => {
      (prismaMock.tag.findFirst as any).mockResolvedValue({ id: 3, teamId: TEAM });
      const updated = { id: 3, label: 'Editada', teamId: TEAM };
      (prismaMock.tag.update as any).mockResolvedValue(updated);

      const result = await tagService.update(3, { label: 'Editada' }, TEAM);

      expect(result).toEqual(updated);
      expect(prismaMock.tag.update).toHaveBeenCalledWith({ where: { id: 3 }, data: { label: 'Editada' } });
    });

    it('bloqueia update de tag fora da equipe', async () => {
      (prismaMock.tag.findFirst as any).mockResolvedValue(null);
      await expect(tagService.update(3, { label: 'x' }, TEAM)).rejects.toMatchObject({ statusCode: 404 });
      expect(prismaMock.tag.update).not.toHaveBeenCalled();
    });
  });
});
