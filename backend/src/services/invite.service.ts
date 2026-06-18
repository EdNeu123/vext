import { prisma } from '../config/prisma';
import crypto from 'crypto';
import { ApiError } from '../utils/helpers';
import { auditService } from './audit.service';
import { teamService } from './team.service';

export class InviteService {
  /** Lista convites da equipe ativa */
  async list(teamId: number) {
    return prisma.invite.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      include: { inviter: { select: { id: true, name: true } } },
    });
  }

  /**
   * Cria convite para a equipe ativa.
   * role só pode ser 'moderator' | 'seller' (createInviteSchema) — 'admin'
   * nunca é convidável (seção 2.3 do guia multi-tenant).
   * Valida o limite de membros da equipe ANTES de gerar o convite (seção 2.4).
   */
  async create(data: any, invitedBy: number, inviterName: string, teamId: number) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { owner: { select: { plan: true } } },
    });
    if (!team) throw ApiError.notFound('Equipe não encontrada');

    // Não faz sentido gerar convite se a equipe já está no limite (seção 2.4)
    await teamService.assertMemberLimitNotReached(teamId, team.owner.plan);

    // 32 bytes = 256 bits de entropia — resistente a brute-force
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await prisma.invite.create({
      data: {
        token, email: data.email, name: data.name, role: data.role,
        permissions: data.permissions || [], invitedBy, teamId, expiresAt,
      },
    });

    await auditService.log('invite', invite.id, 'Convite Criado', invitedBy, inviterName, undefined, undefined, teamId);
    return { token, id: invite.id, expiresAt };
  }

  /** Valida um convite por token — usado pela tela de registro (não exige autenticação) */
  async validate(token: string) {
    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite) throw ApiError.notFound('Convite não encontrado');
    if (invite.status !== 'pending') throw ApiError.badRequest('Convite já utilizado');
    if (new Date() > invite.expiresAt) throw ApiError.badRequest('Convite expirado');
    return { name: invite.name, email: invite.email, role: invite.role, teamId: invite.teamId };
  }

  async revoke(id: number, teamId: number, adminId: number, adminName: string) {
    const invite = await prisma.invite.findFirst({ where: { id, teamId } });
    if (!invite) throw ApiError.notFound('Convite não encontrado');
    await prisma.invite.update({ where: { id }, data: { status: 'expired' } });
    await auditService.log('invite', id, 'Convite Revogado', adminId, adminName, undefined, undefined, teamId);
  }
}

export const inviteService = new InviteService();
