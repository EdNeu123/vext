import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/helpers';
import type { CreateTaskInput, UpdateTaskInput } from '../models/schemas';

export class TaskService {
  async list(teamId: number, page = 1, limit = 50) {
    const where = { teamId };

    const [data, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { dueDate: 'asc' },
        include: {
          contact: { select: { id: true, name: true } },
          card: { select: { id: true, title: true } },
          owner: { select: { id: true, name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return { data, total };
  }

  async getById(id: number, teamId: number) {
    const task = await prisma.task.findFirst({
      where: { id, teamId },
      include: {
        contact: { select: { id: true, name: true } },
        card: { select: { id: true, title: true } },
      },
    });
    if (!task) throw ApiError.notFound('Tarefa não encontrada');
    return task;
  }

  async getByDate(date: Date, teamId: number) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.task.findMany({
      where: { teamId, dueDate: { gte: startOfDay, lte: endOfDay } },
      orderBy: { dueDate: 'asc' },
      include: {
        contact: { select: { id: true, name: true } },
        card: { select: { id: true, title: true } },
        owner: { select: { id: true, name: true } },
      },
    });
  }

  async getByMonth(year: number, month: number, teamId: number) {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    return prisma.task.findMany({
      where: { teamId, dueDate: { gte: startOfMonth, lte: endOfMonth } },
      orderBy: { dueDate: 'asc' },
      include: {
        contact: { select: { id: true, name: true } },
        card: { select: { id: true, title: true } },
      },
    });
  }

  async create(data: CreateTaskInput, userId: number, userName: string, teamId: number) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const task = await tx.task.create({
        data: { ...data, dueDate: new Date(data.dueDate), ownerId: userId, teamId },
      });
      await tx.auditLog.create({
        data: {
          entityType: 'task', entityId: task.id, action: 'Tarefa Criada',
          userId, userName, teamId,
        },
      });
      return task;
    });
  }

  async update(id: number, data: UpdateTaskInput, userId: number, userName: string, teamId: number) {
    const existing = await this.getById(id, teamId);

    if (data.dueDate && !data.reason) {
      const newDate = new Date(data.dueDate);
      if (newDate.getTime() !== existing.dueDate.getTime()) {
        throw ApiError.badRequest('É obrigatório informar o motivo do reagendamento');
      }
    }

    const { reason, ...updateData } = data;
    const updatePayload: any = { ...updateData };

    if (updateData.dueDate) updatePayload.dueDate = new Date(updateData.dueDate);
    if (updateData.status === 'completed') updatePayload.completedAt = new Date();

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const task = await tx.task.update({ where: { id }, data: updatePayload });
      await tx.auditLog.create({
        data: {
          entityType: 'task', entityId: id, action: 'Tarefa Atualizada',
          userId, userName, reason: reason ?? null, teamId,
        },
      });
      return task;
    });
  }

  async delete(id: number, userId: number, userName: string, teamId: number) {
    await this.getById(id, teamId);
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.auditLog.create({
        data: {
          entityType: 'task', entityId: id, action: 'Tarefa Deletada',
          userId, userName, teamId,
        },
      });
      await tx.task.delete({ where: { id } });
    });
  }

  async getPendingCount(teamId: number) {
    return prisma.task.count({ where: { status: 'pending', teamId } });
  }
}

export const taskService = new TaskService();
