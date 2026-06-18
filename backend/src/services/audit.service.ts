import { prisma } from '../config/prisma';

export class AuditService {
  async log(
    entityType: any,
    entityId: number,
    action: string,
    userId: number,
    userName: string,
    changes?: Record<string, any>,
    reason?: string,
    teamId?: number,
  ) {
    return prisma.auditLog.create({
      data: { entityType, entityId, action, userId, userName, changes, reason, teamId },
    });
  }

  /** Histórico de uma entidade, restrito à equipe (quando informado) */
  async getByEntity(entityType: any, entityId: number, teamId?: number) {
    return prisma.auditLog.findMany({
      where: { entityType, entityId, ...(teamId ? { teamId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Logs recentes da equipe atual */
  async getRecent(teamId: number, limit = 100) {
    return prisma.auditLog.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const auditService = new AuditService();
