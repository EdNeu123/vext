/**
 * Testes de aceitação — Convites.
 *   RF-0015 Convidar Usuário para Equipe (limite de membros do plano; papéis permitidos)
 *
 * Observações:
 *  - "Somente o ADMIN pode enviar convites": autorização via middleware de rota
 *    (requireTeamAdmin), fora do service — coberta em teste de rota.
 *  - "Funções permitidas: VENDEDOR e MODERADOR": garantido pelo Zod
 *    createInviteSchema (role nunca = admin). Aqui validamos o caminho do limite.
 */
import { describe, it, expect, vi } from 'vitest';
import { prismaMock } from '../helpers/prismaMock';

// Controla o limite de membros via mock do teamService.
// vi.hoisted garante que o spy exista antes do vi.mock (que é içado ao topo).
const { assertLimit } = vi.hoisted(() => ({ assertLimit: vi.fn() }));
vi.mock('../../src/services/team.service', () => ({
  teamService: { assertMemberLimitNotReached: assertLimit },
}));

import { inviteService } from '../../src/services/invite.service';

const TEAM = 1;
const ADMIN = 10;
const ADMINNAME = 'Edu';

describe('RF-0015 — Convidar Usuário para Equipe', () => {
  it('CA: convite rejeitado quando a equipe atingiu o limite do plano', async () => {
    (prismaMock.team.findUnique as any).mockResolvedValue({ id: TEAM, owner: { plan: 'free' } });
    assertLimit.mockRejectedValueOnce(Object.assign(new Error('limite'), { statusCode: 403 }));

    await expect(
      inviteService.create({ email: 'novo@x.com', name: 'Novo', role: 'seller' }, ADMIN, ADMINNAME, TEAM),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.invite.create).not.toHaveBeenCalled();
  });

  it('gera convite com token de alta entropia quando dentro do limite', async () => {
    (prismaMock.team.findUnique as any).mockResolvedValue({ id: TEAM, owner: { plan: 'premium' } });
    assertLimit.mockResolvedValueOnce(undefined);
    (prismaMock.invite.create as any).mockResolvedValue({ id: 5, token: 'x', expiresAt: new Date() });
    (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

    const r = await inviteService.create(
      { email: 'novo@x.com', name: 'Novo', role: 'moderator' }, ADMIN, ADMINNAME, TEAM,
    );

    expect(r.token).toBeDefined();
    // token gerado com 32 bytes → 64 hex chars
    const arg = (prismaMock.invite.create as any).mock.calls[0][0];
    expect(arg.data.token).toHaveLength(64);
    expect(arg.data.role).toBe('moderator');
  });

  it('CA: prazo de validade do convite é 7 dias à frente', async () => {
    (prismaMock.team.findUnique as any).mockResolvedValue({ id: TEAM, owner: { plan: 'free' } });
    assertLimit.mockResolvedValueOnce(undefined);
    (prismaMock.invite.create as any).mockResolvedValue({ id: 6, token: 'y', expiresAt: new Date() });
    (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

    await inviteService.create({ email: 'a@x.com', name: 'A', role: 'seller' }, ADMIN, ADMINNAME, TEAM);

    const arg = (prismaMock.invite.create as any).mock.calls[0][0];
    const diffDays = Math.round((arg.data.expiresAt.getTime() - Date.now()) / 86400000);
    expect(diffDays).toBe(7);
  });
});
