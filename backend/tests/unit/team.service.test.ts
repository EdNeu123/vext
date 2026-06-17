/**
 * Testes unitários — TeamService (entidades `teams` / `team_members`).
 * POST (create, com transação team+teamMember admin + limite de plano),
 * UPDATE (rename), GET ALL (listMyTeams), GET (getById).
 *
 * Regras multi-tenant validadas: limite de equipes por plano, criador vira ADMIN,
 * criação atômica de Team + TeamMember(role=admin).
 */
import { describe, it, expect } from 'vitest';
import { prismaMock } from '../helpers/prismaMock';
import { teamService } from '../../src/services/team.service';

const OWNER = 10;
const OWNERNAME = 'Edu';

describe('TeamService', () => {
  describe('GET ALL (listMyTeams)', () => {
    it('lista memberships do usuário (owned + joined)', async () => {
      (prismaMock.teamMember.findMany as any).mockResolvedValue([
        { teamId: 1, userId: OWNER, role: 'admin', team: { id: 1, name: 'Vendas' } },
      ]);

      const result = await teamService.listMyTeams(OWNER);

      expect(result).toHaveLength(1);
      const arg = (prismaMock.teamMember.findMany as any).mock.calls[0][0];
      expect(arg.where).toEqual({ userId: OWNER });
    });
  });

  describe('GET (getById)', () => {
    it('retorna equipe com memberLimit derivado do plano do dono', async () => {
      (prismaMock.team.findUnique as any).mockResolvedValue({
        id: 1, name: 'Vendas', owner: { id: OWNER, name: 'Edu', plan: 'premium' },
        members: [], _count: { contacts: 0, cards: 0, members: 1 },
      });

      const result = await teamService.getById(1);

      expect(result.memberLimit).toBe(20); // premium
    });

    it('lança 404 quando a equipe não existe', async () => {
      (prismaMock.team.findUnique as any).mockResolvedValue(null);
      await expect(teamService.getById(99)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('POST (create) — transação + limites de plano', () => {
    it('cria equipe e adiciona o criador como ADMIN na mesma transação', async () => {
      (prismaMock.user.findUnique as any).mockResolvedValue({ plan: 'free' });
      (prismaMock.team.count as any).mockResolvedValue(0); // ainda sem equipes próprias
      (prismaMock.team.findUnique as any).mockResolvedValue(null); // orgCode único
      (prismaMock.team.create as any).mockResolvedValue({ id: 50, name: 'Nova', ownerId: OWNER });
      (prismaMock.teamMember.create as any).mockResolvedValue({ id: 1, teamId: 50, userId: OWNER, role: 'admin' });
      (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

      const result = await teamService.create('Nova', OWNER, OWNERNAME);

      expect(result.id).toBe(50);
      expect(prismaMock.$transaction).toHaveBeenCalled();
      // criador entra como admin
      expect(prismaMock.teamMember.create).toHaveBeenCalledWith({
        data: { teamId: 50, userId: OWNER, role: 'admin' },
      });
    });

    it('bloqueia criação quando plano free já tem 1 equipe própria (403)', async () => {
      (prismaMock.user.findUnique as any).mockResolvedValue({ plan: 'free' });
      (prismaMock.team.count as any).mockResolvedValue(1); // já no limite free

      await expect(teamService.create('Segunda', OWNER, OWNERNAME)).rejects.toMatchObject({ statusCode: 403 });
      expect(prismaMock.team.create).not.toHaveBeenCalled();
    });

    it('lança 404 quando o usuário dono não existe', async () => {
      (prismaMock.user.findUnique as any).mockResolvedValue(null);
      await expect(teamService.create('X', OWNER, OWNERNAME)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('UPDATE (update)', () => {
    it('renomeia a equipe e registra auditoria', async () => {
      (prismaMock.team.update as any).mockResolvedValue({ id: 1, name: 'Renomeada' });
      (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

      await teamService.update(1, { name: 'Renomeada' }, OWNER, OWNERNAME);

      expect(prismaMock.team.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { name: 'Renomeada' } });
    });

    it('não faz nada quando name não é informado', async () => {
      await teamService.update(1, {}, OWNER, OWNERNAME);
      expect(prismaMock.team.update).not.toHaveBeenCalled();
    });
  });
});
