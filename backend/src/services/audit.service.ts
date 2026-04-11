import { prisma } from '../config/prisma';

export class AuditService {
  async log(
    entityType: any,
    entityId: number,
    action: string,
    userId: number,
    userName: string,
    changes?: Record<string, any>,
    reason?: string
  ) {
    return prisma.auditLog.create({
      data: { entityType, entityId, action, userId, userName, changes, reason },
    });
  }

  async getByEntity(entityType: any, entityId: number) {
    return prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRecent(limit = 100) {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const auditService = new AuditService();
