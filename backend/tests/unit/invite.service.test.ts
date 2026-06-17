/**
 * Testes unitários — InviteService (entidade `invites`).
 * POST (create, com limite de membros), GET ALL (list), GET (validate por token),
 * UPDATE (revoke → status=expired). Escritas em $transaction.
 *
 * Nota: create() depende de teamService.assertMemberLimitNotReached — mockado aqui
 * para isolar o InviteService (teste unitário puro).
 */
import { describe, it, expect, vi } from 'vitest';
import { prismaMock } from '../helpers/prismaMock';

// Isola a dependência de teamService (limite de membros)
vi.mock('../../src/services/team.service', () => ({
  teamService: { assertMemberLimitNotReached: vi.fn().mockResolvedValue(undefined) },
}));

import { inviteService } from '../../src/services/invite.service';

const TEAM = 1;
const INVITER = 10;
const INVITERNAME = 'Edu';

describe('InviteService', () => {
  describe('GET ALL (list)', () => {
    it('retorna convites da equipe', async () => {
      (prismaMock.invite.findMany as any).mockResolvedValue([{ id: 1, email: 'a@x.com', teamId: TEAM }]);
      const result = await inviteService.list(TEAM);
      expect(result).toHaveLength(1);
      const arg = (prismaMock.invite.findMany as any).mock.calls[0][0];
      expect(arg.where).toEqual({ teamId: TEAM });
    });
  });

  describe('GET (validate por token)', () => {
    it('retorna dados do convite quando válido e pendente', async () => {
      (prismaMock.invite.findUnique as any).mockResolvedValue({
        name: 'Novo', email: 'novo@x.com', role: 'seller', teamId: TEAM,
        status: 'pending', expiresAt: new Date(Date.now() + 86400000),
      });

      const result = await inviteService.validate('tok123');

      expect(result).toEqual({ name: 'Novo', email: 'novo@x.com', role: 'seller', teamId: TEAM });
    });

    it('lança 404 quando token não existe', async () => {
      (prismaMock.invite.findUnique as any).mockResolvedValue(null);
      await expect(inviteService.validate('nope')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lança 400 quando convite já foi usado', async () => {
      (prismaMock.invite.findUnique as any).mockResolvedValue({ status: 'used', expiresAt: new Date(Date.now() + 86400000) });
      await expect(inviteService.validate('tok')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lança 400 quando convite expirou', async () => {
      (prismaMock.invite.findUnique as any).mockResolvedValue({ status: 'pending', expiresAt: new Date(Date.now() - 1000) });
      await expect(inviteService.validate('tok')).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('POST (create) — transação', () => {
    it('gera convite com token e grava auditoria na transação', async () => {
      (prismaMock.team.findUnique as any).mockResolvedValue({ id: TEAM, owner: { plan: 'free' } });
      (prismaMock.invite.create as any).mockResolvedValue({ id: 5, token: 'gen', expiresAt: new Date() });
      (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

      const result = await inviteService.create(
        { email: 'novo@x.com', name: 'Novo', role: 'seller', permissions: [] },
        INVITER, INVITERNAME, TEAM,
      );

      expect(result).toMatchObject({ id: 5 });
      expect(result.token).toBeDefined();
      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ entityType: 'invite', entityId: 5, action: 'Convite Criado' }),
      });
    });

    it('lança 404 quando equipe não existe', async () => {
      (prismaMock.team.findUnique as any).mockResolvedValue(null);
      await expect(inviteService.create({ email: 'a@x.com', name: 'A', role: 'seller' }, INVITER, INVITERNAME, TEAM))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('UPDATE (revoke) — transação', () => {
    it('marca convite como expired e grava auditoria', async () => {
      (prismaMock.invite.findFirst as any).mockResolvedValue({ id: 7, teamId: TEAM });
      (prismaMock.invite.update as any).mockResolvedValue({ id: 7, status: 'expired' });
      (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

      await inviteService.revoke(7, TEAM, INVITER, INVITERNAME);

      expect(prismaMock.invite.update).toHaveBeenCalledWith({ where: { id: 7 }, data: { status: 'expired' } });
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ entityType: 'invite', entityId: 7, action: 'Convite Revogado' }),
      });
    });

    it('lança 404 ao revogar convite de outra equipe', async () => {
      (prismaMock.invite.findFirst as any).mockResolvedValue(null);
      await expect(inviteService.revoke(7, TEAM, INVITER, INVITERNAME)).rejects.toMatchObject({ statusCode: 404 });
      expect(prismaMock.invite.update).not.toHaveBeenCalled();
    });
  });
});
