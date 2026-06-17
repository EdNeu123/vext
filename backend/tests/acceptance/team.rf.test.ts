/**
 * Testes de aceitação — Equipes (multi-tenant).
 *   RF-0010 Registrar Equipe (limites de plano FREE/PREMIUM — RN-0007/RN-0008)
 *   RF-0011 Consulta de Equipe
 *   RF-0013 Alteração de Equipe / Transferência de posse (RN-0005)
 *   RF-0016 Remover Usuário da Equipe (hierarquia de papéis + auditoria)
 */
import { describe, it, expect, vi } from 'vitest';
import { prismaMock } from '../helpers/prismaMock';
import { teamService } from '../../src/services/team.service';

const OWNER = 10;
const NAME = 'Edu';

describe('RF-0010 — Registrar Equipe (limites de plano)', () => {
  it('CA2/RN-0007: plano FREE não cria 2ª equipe (limite 1) → 403', async () => {
    (prismaMock.user.findUnique as any).mockResolvedValue({ plan: 'free' });
    (prismaMock.team.count as any).mockResolvedValue(1);
    await expect(teamService.create('Segunda', OWNER, NAME)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('CA3/RN-0008: plano PREMIUM permite até 5 equipes (4ª passa)', async () => {
    (prismaMock.user.findUnique as any).mockResolvedValue({ plan: 'premium' });
    (prismaMock.team.count as any).mockResolvedValue(4); // < 5
    (prismaMock.team.findUnique as any).mockResolvedValue(null);
    (prismaMock.team.create as any).mockResolvedValue({ id: 30, name: 'Quinta', ownerId: OWNER });
    (prismaMock.teamMember.create as any).mockResolvedValue({ id: 1 });
    (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

    const r = await teamService.create('Quinta', OWNER, NAME);
    expect(r.id).toBe(30);
  });

  it('criador é adicionado como ADMIN (role=admin)', async () => {
    (prismaMock.user.findUnique as any).mockResolvedValue({ plan: 'free' });
    (prismaMock.team.count as any).mockResolvedValue(0);
    (prismaMock.team.findUnique as any).mockResolvedValue(null);
    (prismaMock.team.create as any).mockResolvedValue({ id: 31, name: 'Primeira', ownerId: OWNER });
    (prismaMock.teamMember.create as any).mockResolvedValue({ id: 1 });
    (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

    await teamService.create('Primeira', OWNER, NAME);
    expect(prismaMock.teamMember.create).toHaveBeenCalledWith({
      data: { teamId: 31, userId: OWNER, role: 'admin' },
    });
  });
});

describe('RF-0011 — Consulta de Equipe', () => {
  it('CA1: equipe inexistente → 404', async () => {
    (prismaMock.team.findUnique as any).mockResolvedValue(null);
    await expect(teamService.getById(99)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('memberLimit reflete o plano do dono (free=6)', async () => {
    (prismaMock.team.findUnique as any).mockResolvedValue({
      id: 1, name: 'Eq', owner: { id: OWNER, name: 'Edu', plan: 'free' },
      members: [], _count: { contacts: 0, cards: 0, members: 1 },
    });
    const r = await teamService.getById(1);
    expect(r.memberLimit).toBe(6);
  });
});

describe('RF-0013 — Transferência de Posse (RN-0005)', () => {
  it('CA: novo ADMIN vira admin e o anterior é rebaixado a moderator', async () => {
    (prismaMock.team.findUnique as any).mockResolvedValue({ id: 1, ownerId: OWNER });
    (prismaMock.teamMember.findUnique as any).mockResolvedValue({ teamId: 1, userId: 20, user: { name: 'Maria' } });
    (prismaMock.team.update as any).mockResolvedValue({ id: 1, ownerId: 20 });
    (prismaMock.teamMember.update as any).mockResolvedValue({});
    (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

    await teamService.transferOwnership(1, 20, OWNER, NAME);

    // novo dono no Team
    expect(prismaMock.team.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { ownerId: 20 } });
    // novo membro vira admin; antigo vira moderator
    expect(prismaMock.teamMember.update).toHaveBeenCalledWith({
      where: { teamId_userId: { teamId: 1, userId: 20 } }, data: { role: 'admin' },
    });
    expect(prismaMock.teamMember.update).toHaveBeenCalledWith({
      where: { teamId_userId: { teamId: 1, userId: OWNER } }, data: { role: 'moderator' },
    });
  });

  it('CA: somente o ADMIN atual pode transferir (403 para não-dono)', async () => {
    (prismaMock.team.findUnique as any).mockResolvedValue({ id: 1, ownerId: 999 });
    await expect(teamService.transferOwnership(1, 20, OWNER, NAME))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('CA: novo ADMIN precisa já ser membro da equipe (400 se não for)', async () => {
    (prismaMock.team.findUnique as any).mockResolvedValue({ id: 1, ownerId: OWNER });
    (prismaMock.teamMember.findUnique as any).mockResolvedValue(null);
    await expect(teamService.transferOwnership(1, 20, OWNER, NAME))
      .rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('RF-0016 — Remover Usuário da Equipe', () => {
  it('não permite remover o ADMIN/dono (403 — transferir posse primeiro)', async () => {
    (prismaMock.team.findUnique as any).mockResolvedValue({ id: 1, ownerId: OWNER });
    await expect(teamService.removeMember(1, OWNER, OWNER, NAME, 'admin'))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('CA1: remoção é registrada no log de auditoria', async () => {
    (prismaMock.team.findUnique as any).mockResolvedValue({ id: 1, ownerId: OWNER });
    (prismaMock.teamMember.findUnique as any).mockResolvedValue({ teamId: 1, userId: 20 });
    (prismaMock.teamMember.delete as any).mockResolvedValue({});
    (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

    await teamService.removeMember(1, 20, OWNER, NAME, 'admin');

    expect(prismaMock.teamMember.delete).toHaveBeenCalledWith({
      where: { teamId_userId: { teamId: 1, userId: 20 } },
    });
    expect(prismaMock.auditLog.create).toHaveBeenCalled();
  });

  it('membro inexistente na equipe → 404', async () => {
    (prismaMock.team.findUnique as any).mockResolvedValue({ id: 1, ownerId: OWNER });
    (prismaMock.teamMember.findUnique as any).mockResolvedValue(null);
    await expect(teamService.removeMember(1, 20, OWNER, NAME, 'admin'))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});
