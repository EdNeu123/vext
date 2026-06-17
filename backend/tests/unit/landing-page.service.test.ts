/**
 * Testes unitários — LandingPageService (entidade `landing_pages`).
 * POST (com slug único), UPDATE (com checagem de slug), GET ALL, GET. Escritas em $transaction.
 */
import { describe, it, expect } from 'vitest';
import { prismaMock } from '../helpers/prismaMock';
import { landingPageService } from '../../src/services/landing-page.service';

const TEAM = 1;
const OWNER = 10;
const USERNAME = 'Edu';

describe('LandingPageService', () => {
  describe('GET ALL (list)', () => {
    it('retorna páginas da equipe ordenadas por createdAt desc', async () => {
      (prismaMock.landingPage.findMany as any).mockResolvedValue([{ id: 1, title: 'LP', teamId: TEAM }]);
      const result = await landingPageService.list(TEAM);
      expect(result).toEqual([{ id: 1, title: 'LP', teamId: TEAM }]);
      const arg = (prismaMock.landingPage.findMany as any).mock.calls[0][0];
      expect(arg.where).toEqual({ teamId: TEAM });
      expect(arg.orderBy).toEqual({ createdAt: 'desc' });
    });
  });

  describe('GET (getById)', () => {
    it('retorna página da equipe', async () => {
      (prismaMock.landingPage.findFirst as any).mockResolvedValue({ id: 3, teamId: TEAM });
      const result = await landingPageService.getById(3, TEAM);
      expect(result.id).toBe(3);
      const arg = (prismaMock.landingPage.findFirst as any).mock.calls[0][0];
      expect(arg.where).toEqual({ id: 3, teamId: TEAM });
    });

    it('lança 404 fora da equipe', async () => {
      (prismaMock.landingPage.findFirst as any).mockResolvedValue(null);
      await expect(landingPageService.getById(3, TEAM)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('POST (create) — transação', () => {
    it('cria página quando slug livre e grava auditoria', async () => {
      (prismaMock.landingPage.findUnique as any).mockResolvedValue(null); // slug livre
      const created = { id: 9, slug: 'promo', teamId: TEAM, ownerId: OWNER };
      (prismaMock.landingPage.create as any).mockResolvedValue(created);
      (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

      const result = await landingPageService.create({ title: 'Promo', headline: 'H', slug: 'promo' }, OWNER, USERNAME, TEAM);

      expect(result).toEqual(created);
      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ entityType: 'landing_page', entityId: 9, action: 'Landing Page Criada' }),
      });
    });

    it('lança 409 quando slug já existe', async () => {
      (prismaMock.landingPage.findUnique as any).mockResolvedValue({ id: 1, slug: 'promo' });
      await expect(landingPageService.create({ title: 'X', headline: 'H', slug: 'promo' }, OWNER, USERNAME, TEAM))
        .rejects.toMatchObject({ statusCode: 409 });
      expect(prismaMock.landingPage.create).not.toHaveBeenCalled();
    });
  });

  describe('UPDATE (update) — transação', () => {
    it('valida posse, checa slug e atualiza', async () => {
      (prismaMock.landingPage.findFirst as any).mockResolvedValue({ id: 4, teamId: TEAM }); // guard posse
      (prismaMock.landingPage.findUnique as any).mockResolvedValue(null); // slug livre
      (prismaMock.landingPage.update as any).mockResolvedValue({ id: 4, slug: 'novo' });
      (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

      const result = await landingPageService.update(4, { slug: 'novo' }, OWNER, USERNAME, TEAM);

      expect(result.id).toBe(4);
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ entityType: 'landing_page', entityId: 4, action: 'Landing Page Atualizada' }),
      });
    });

    it('lança 409 quando slug pertence a outra página', async () => {
      (prismaMock.landingPage.findFirst as any).mockResolvedValue({ id: 4, teamId: TEAM });
      (prismaMock.landingPage.findUnique as any).mockResolvedValue({ id: 99, slug: 'novo' });
      await expect(landingPageService.update(4, { slug: 'novo' }, OWNER, USERNAME, TEAM))
        .rejects.toMatchObject({ statusCode: 409 });
    });
  });
});
