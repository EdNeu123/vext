import { prisma } from '../config/prisma';
import { ApiError } from '../utils/helpers';
import { auditService } from './audit.service';
import type { CreateTaskInput, UpdateTaskInput } from '../models/schemas';

export class TaskService {
  async list(userId: number, role: string, page = 1, limit = 50) {
    const where = role !== 'admin' ? { ownerId: userId } : {};

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

  async getById(id: number, requesterId?: number, requesterRole?: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        contact: { select: { id: true, name: true } },
        card: { select: { id: true, title: true } },
      },
    });
    if (!task) throw ApiError.notFound('Tarefa não encontrada');
    if (requesterId && requesterRole !== 'admin' && task.ownerId !== requesterId) {
      throw ApiError.forbidden('Acesso negado');
    }
    return task;
  }

  async getByDate(date: Date, userId: number, role: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = { dueDate: { gte: startOfDay, lte: endOfDay } };
    if (role !== 'admin') where.ownerId = userId;

    return prisma.task.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        contact: { select: { id: true, name: true } },
        card: { select: { id: true, title: true } },
        owner: { select: { id: true, name: true } },
      },
    });
  }

  async getByMonth(year: number, month: number, userId: number, role: string) {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const where: any = { dueDate: { gte: startOfMonth, lte: endOfMonth } };
    if (role !== 'admin') where.ownerId = userId;

    return prisma.task.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        contact: { select: { id: true, name: true } },
        card: { select: { id: true, title: true } },
      },
    });
  }

  async create(data: CreateTaskInput, userId: number, userName: string) {
    const task = await prisma.task.create({
      data: { ...data, dueDate: new Date(data.dueDate), ownerId: userId },
    });
    await auditService.log('task', task.id, 'Tarefa Criada', userId, userName);
    return task;
  }

  async update(id: number, data: UpdateTaskInput, userId: number, userName: string, userRole: string) {
    const existing = await this.getById(id, userId, userRole);

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

    const task = await prisma.task.update({ where: { id }, data: updatePayload });
    await auditService.log('task', id, 'Tarefa Atualizada', userId, userName, undefined, reason);
    return task;
  }

  async delete(id: number, userId: number, userName: string, userRole: string) {
    await this.getById(id, userId, userRole);
    await auditService.log('task', id, 'Tarefa Deletada', userId, userName);
    await prisma.task.delete({ where: { id } });
  }

  async getPendingCount(userId: number, role: string) {
    const where: any = { status: 'pending' };
    if (role !== 'admin') where.ownerId = userId;
    return prisma.task.count({ where });
  }
}

export const taskService = new TaskService();
