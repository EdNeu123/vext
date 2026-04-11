import { prisma } from '../config/prisma';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
import { ApiError } from '../utils/helpers';
import { auditService } from './audit.service';

export class InviteService {
  async list() {
    return prisma.invite.findMany({
      orderBy: { createdAt: 'desc' },
      include: { inviter: { select: { id: true, name: true } } },
    });
  }

  async create(data: any, invitedBy: number, inviterName: string) {
    // 32 bytes = 256 bits de entropia — resistente a brute-force
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await prisma.invite.create({
      data: {
        token, email: data.email, name: data.name, role: data.role,
        permissions: data.permissions || [], invitedBy, expiresAt,
      },
    });

    await auditService.log('invite', invite.id, 'Convite Criado', invitedBy, inviterName);
    return { token, id: invite.id, expiresAt };
  }

  async validate(token: string) {
    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite) throw ApiError.notFound('Convite não encontrado');
    if (invite.status !== 'pending') throw ApiError.badRequest('Convite já utilizado');
    if (new Date() > invite.expiresAt) throw ApiError.badRequest('Convite expirado');
    return { name: invite.name, email: invite.email, role: invite.role };
  }

  async revoke(id: number, adminId: number, adminName: string) {
    await prisma.invite.update({ where: { id }, data: { status: 'expired' } });
    await auditService.log('invite', id, 'Convite Revogado', adminId, adminName);
  }
}

export const inviteService = new InviteService();
