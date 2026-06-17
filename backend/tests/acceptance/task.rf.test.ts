/**
 * Testes de aceitação — Tarefas.
 *   RF-0038 Registro de Tarefa
 *   RF-0039 Consulta de Tarefa
 *   RF-0041 Alteração de Tarefa (completedAt)
 *   RF-0042 Deleção de Tarefa
 */
import { describe, it, expect } from 'vitest';
import { prismaMock } from '../helpers/prismaMock';
import { taskService } from '../../src/services/task.service';

const TEAM = 1;
const USER = 10;
const NAME = 'Edu';

describe('RF-0038 — Registro de Tarefa', () => {
  it('CA2: dueDate é convertido para Date; CA3: status pending é default do banco', async () => {
    (prismaMock.task.create as any).mockResolvedValue({ id: 1, title: 'Ligar', status: 'pending', teamId: TEAM });
    (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

    await taskService.create({ title: 'Ligar', dueDate: '2026-08-01T09:00:00Z' } as any, USER, NAME, TEAM);

    const arg = (prismaMock.task.create as any).mock.calls[0][0];
    expect(arg.data.dueDate).toBeInstanceOf(Date);
    expect(arg.data).not.toHaveProperty('status'); // default @default(pending)
    expect(arg.data).toMatchObject({ ownerId: USER, teamId: TEAM });
  });

  it('CA4: tarefa pode ser criada sem contato ou card associado', async () => {
    (prismaMock.task.create as any).mockResolvedValue({ id: 2, title: 'Solo', teamId: TEAM });
    (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

    await taskService.create({ title: 'Solo', dueDate: '2026-08-01T09:00:00Z' } as any, USER, NAME, TEAM);

    const arg = (prismaMock.task.create as any).mock.calls[0][0];
    expect(arg.data.cardId).toBeUndefined();
    expect(arg.data.contactId).toBeUndefined();
  });
});

describe('RF-0039 — Consulta de Tarefa', () => {
  it('CA1: tarefa inexistente na equipe → 404', async () => {
    (prismaMock.task.findFirst as any).mockResolvedValue(null);
    await expect(taskService.getById(99, TEAM)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('RF-0041 — Alteração de Tarefa', () => {
  it('CA1: ao marcar como completed, completedAt é preenchido automaticamente', async () => {
    (prismaMock.task.findFirst as any).mockResolvedValue({ id: 3, dueDate: new Date('2026-08-01T09:00:00Z'), teamId: TEAM });
    (prismaMock.task.update as any).mockResolvedValue({ id: 3, status: 'completed' });
    (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

    await taskService.update(3, { status: 'completed' } as any, USER, NAME, TEAM);

    const arg = (prismaMock.task.update as any).mock.calls[0][0];
    expect(arg.data.completedAt).toBeInstanceOf(Date);
  });

  it('CA3: tarefa inexistente → 404', async () => {
    (prismaMock.task.findFirst as any).mockResolvedValue(null);
    await expect(taskService.update(99, { status: 'cancelled' } as any, USER, NAME, TEAM))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('RN: reagendar (mudar dueDate) sem motivo é bloqueado (400)', async () => {
    (prismaMock.task.findFirst as any).mockResolvedValue({ id: 4, dueDate: new Date('2026-08-01T09:00:00Z'), teamId: TEAM });
    await expect(
      taskService.update(4, { dueDate: '2026-08-10T09:00:00Z' } as any, USER, NAME, TEAM),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('RF-0042 — Deleção de Tarefa', () => {
  it('CA3: tarefa inexistente → 404 (guard antes da exclusão)', async () => {
    (prismaMock.task.findFirst as any).mockResolvedValue(null);
    await expect(taskService.delete(99, USER, NAME, TEAM)).rejects.toMatchObject({ statusCode: 404 });
    expect(prismaMock.task.delete).not.toHaveBeenCalled();
  });

  it('exclui tarefa existente e registra auditoria na transação', async () => {
    (prismaMock.task.findFirst as any).mockResolvedValue({ id: 5, teamId: TEAM });
    (prismaMock.task.delete as any).mockResolvedValue({ id: 5 });
    (prismaMock.auditLog.create as any).mockResolvedValue({ id: 1 });

    await taskService.delete(5, USER, NAME, TEAM);

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ entityType: 'task', entityId: 5, action: 'Tarefa Deletada' }),
    });
    expect(prismaMock.task.delete).toHaveBeenCalledWith({ where: { id: 5 } });
  });
});
