/**
 * Testes unitários — ContactService (entidade `contacts`).
 * Cobre POST, UPDATE, GET ALL (com paginação/busca) e GET. DB mockado.
 */
import { describe, it, expect } from 'vitest';
import { prismaMock } from '../helpers/prismaMock';
import { contactService } from '../../src/services/contact.service';

const TEAM = 1;
const OWNER = 42;

describe('ContactService', () => {
  describe('GET ALL (list)', () => {
    it('retorna data + total escopados por equipe (sem busca)', async () => {
      (prismaMock.contact.findMany as any).mockResolvedValue([{ id: 1, name: 'João' }]);
      (prismaMock.contact.count as any).mockResolvedValue(1);

      const result = await contactService.list(TEAM);

      expect(result).toEqual({ data: [{ id: 1, name: 'João' }], total: 1 });
      const callArg = (prismaMock.contact.findMany as any).mock.calls[0][0];
      expect(callArg.where).toEqual({ teamId: TEAM });
      expect(callArg.skip).toBe(0);
      expect(callArg.take).toBe(20);
    });

    it('aplica filtro OR de busca (name/email/company)', async () => {
      (prismaMock.contact.findMany as any).mockResolvedValue([]);
      (prismaMock.contact.count as any).mockResolvedValue(0);

      await contactService.list(TEAM, 'acme', 2, 10);

      const callArg = (prismaMock.contact.findMany as any).mock.calls[0][0];
      expect(callArg.where.teamId).toBe(TEAM);
      expect(callArg.where.OR).toHaveLength(3);
      expect(callArg.skip).toBe(10); // (page2-1)*10
      expect(callArg.take).toBe(10);
    });
  });

  describe('GET (getById)', () => {
    it('retorna contato da equipe com cards inclusos', async () => {
      const row = { id: 3, name: 'Maria', teamId: TEAM, cards: [] };
      (prismaMock.contact.findFirst as any).mockResolvedValue(row);

      const result = await contactService.getById(3, TEAM);

      expect(result).toEqual(row);
      const arg = (prismaMock.contact.findFirst as any).mock.calls[0][0];
      expect(arg.where).toEqual({ id: 3, teamId: TEAM });
    });

    it('lança 404 quando não pertence à equipe', async () => {
      (prismaMock.contact.findFirst as any).mockResolvedValue(null);
      await expect(contactService.getById(3, TEAM)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('POST (create)', () => {
    it('cria contato injetando ownerId e teamId', async () => {
      const input = { name: 'Novo Contato', email: 'c@x.com' } as any;
      const created = { id: 9, ...input, ownerId: OWNER, teamId: TEAM };
      (prismaMock.contact.create as any).mockResolvedValue(created);

      const result = await contactService.create(input, OWNER, TEAM);

      expect(result).toEqual(created);
      expect(prismaMock.contact.create).toHaveBeenCalledWith({
        data: { ...input, ownerId: OWNER, teamId: TEAM },
      });
    });
  });

  describe('UPDATE (update)', () => {
    it('valida posse e atualiza', async () => {
      (prismaMock.contact.findFirst as any).mockResolvedValue({ id: 4, teamId: TEAM });
      const updated = { id: 4, name: 'Editado', teamId: TEAM };
      (prismaMock.contact.update as any).mockResolvedValue(updated);

      const result = await contactService.update(4, { name: 'Editado' } as any, TEAM);

      expect(result).toEqual(updated);
      expect(prismaMock.contact.update).toHaveBeenCalledWith({ where: { id: 4 }, data: { name: 'Editado' } });
    });

    it('bloqueia update de contato fora da equipe', async () => {
      (prismaMock.contact.findFirst as any).mockResolvedValue(null);
      await expect(contactService.update(4, { name: 'x' } as any, TEAM)).rejects.toMatchObject({ statusCode: 404 });
      expect(prismaMock.contact.update).not.toHaveBeenCalled();
    });
  });
});
