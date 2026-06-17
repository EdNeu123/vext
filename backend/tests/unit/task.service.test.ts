/**
 * Testes unitários — TaskService (entidade `tasks`).
 * POST, UPDATE, GET ALL (paginado), GET. Escritas usam $transaction (task + auditLog).
 */
import { describe, it, expect } from 'vitest';
import { prismaMock } from '../helpers/prismaMock';
import { taskService } from '../../src/services/task.service';

const TEAM = 1;
const USER = 10;
const USERNAME = 'Edu';

describe('TaskService', () => {
  describe('GET ALL (list)', () => {
    it('retorna data + total escopado por equipe, ordenado por dueDate', async () => {
      (prismaMock.task.findMany as any).mockResolvedValue([{ id: 1, title: 'Ligar', teamId: TEAM }]);
      (prismaMock.task.count as any).mockResolvedValue(1);

      const result = await taskService.list(TEAM, 1, 50);

      expect(result).toEqual({ data: [{ id: 1, title: 'Ligar', teamId: TEAM }], total: 1 });
      const arg = (prismaMock.task.findMany as any).mock.calls[0][0];
      expect(arg.where).toEqual({ teamId: TEAM });
      expect(arg.orderBy).toEqual({ dueDate: 'asc' });
    });
  });

  describe('GET (getById)', () => {
    it('retorna tarefa da equipe', async () => {
      (prismaMock.task.findFirst as any).mockResolvedValue({ id: 3, title: 'Reunião', teamId: TEAM });
      const result = await taskService.getById(3, TEAM);
      expect(result.id).toBe(3);
      const arg = (prismaMock.task.findFirst as any).mock.calls[0][0];
      expect(arg.where).toEqual({ id: 3, teamId: TEAM });
    });

    it('lança 404 fora da equipe', async () => {
      (prismaMock.task.findFirst as any).mockResolvedValue(null);
      await expect(taskService.getById(3, TEAM)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('POST (create) — transação', () => {
    it('cria tarefa com ownerId/teamId e grava auditoria na mesma transação', async () => {
      const created = { id: 9, title: 'Nova', teamId: TEAM, ownerId: USER };
      (prismaMock.task.create as any).mockResolvedValue(created);
      (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

      const result = await taskService.create(
        { title: 'Nova', type: 'call', priority: 'high', dueDate: '2026-07-01T10:00:00Z' } as any,
        USER, USERNAME, TEAM,
      );

      expect(result).toEqual(created);
      expect(prismaMock.$transaction).toHaveBeenCalled();
      const arg = (prismaMock.task.create as any).mock.calls[0][0];
      expect(arg.data).toMatchObject({ ownerId: USER, teamId: TEAM, title: 'Nova' });
      expect(arg.data.dueDate).toBeInstanceOf(Date);
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ entityType: 'task', entityId: 9, action: 'Tarefa Criada' }),
      });
    });
  });

  describe('UPDATE (update) — transação', () => {
    it('exige motivo ao reagendar (muda dueDate sem reason → 400)', async () => {
      (prismaMock.task.findFirst as any).mockResolvedValue({ id: 5, dueDate: new Date('2026-07-01T10:00:00Z'), teamId: TEAM });

      await expect(
        taskService.update(5, { dueDate: '2026-07-09T10:00:00Z' } as any, USER, USERNAME, TEAM),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(prismaMock.task.update).not.toHaveBeenCalled();
    });

    it('marca completedAt ao concluir e grava auditoria', async () => {
      (prismaMock.task.findFirst as any).mockResolvedValue({ id: 6, dueDate: new Date('2026-07-01T10:00:00Z'), teamId: TEAM });
      (prismaMock.task.update as any).mockResolvedValue({ id: 6, status: 'completed' });
      (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

      await taskService.update(6, { status: 'completed' } as any, USER, USERNAME, TEAM);

      const arg = (prismaMock.task.update as any).mock.calls[0][0];
      expect(arg.data.completedAt).toBeInstanceOf(Date);
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ entityType: 'task', entityId: 6, action: 'Tarefa Atualizada' }),
      });
    });

    it('bloqueia update fora da equipe (404)', async () => {
      (prismaMock.task.findFirst as any).mockResolvedValue(null);
      await expect(taskService.update(6, { status: 'cancelled' } as any, USER, USERNAME, TEAM))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
