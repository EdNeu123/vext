/**
 * Testes unitários — ProductService (entidade `products`).
 *
 * Cobre o CRUD de leitura/escrita exigido: POST (create), UPDATE, GET ALL (list)
 * e GET (getById). Banco é 100% mockado (vitest-mock-extended) — nenhum acesso
 * real ao PostgreSQL. Valida o ESCOPO POR EQUIPE (teamId) em todas as operações.
 */
import { describe, it, expect } from 'vitest';
import { prismaMock } from '../helpers/prismaMock';
import { productService } from '../../src/services/product.service';

const TEAM = 1;

describe('ProductService', () => {
  describe('GET ALL (list)', () => {
    it('retorna apenas produtos ativos da equipe, ordenados por nome', async () => {
      const rows = [{ id: 1, name: 'A', teamId: TEAM, isActive: true }];
      (prismaMock.product.findMany as any).mockResolvedValue(rows);

      const result = await productService.list(TEAM);

      expect(result).toEqual(rows);
      expect(prismaMock.product.findMany).toHaveBeenCalledWith({
        where: { isActive: true, teamId: TEAM },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('GET (getById)', () => {
    it('retorna o produto quando pertence à equipe', async () => {
      const row = { id: 7, name: 'X', teamId: TEAM };
      (prismaMock.product.findFirst as any).mockResolvedValue(row);

      const result = await productService.getById(7, TEAM);

      expect(result).toEqual(row);
      expect(prismaMock.product.findFirst).toHaveBeenCalledWith({ where: { id: 7, teamId: TEAM } });
    });

    it('lança 404 quando o produto não existe na equipe', async () => {
      (prismaMock.product.findFirst as any).mockResolvedValue(null);

      await expect(productService.getById(99, TEAM)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('POST (create)', () => {
    it('cria produto injetando o teamId', async () => {
      const input = { name: 'Plano Pro', price: 199.9, description: 'desc' };
      const created = { id: 10, ...input, teamId: TEAM };
      (prismaMock.product.create as any).mockResolvedValue(created);

      const result = await productService.create(input, TEAM);

      expect(result).toEqual(created);
      expect(prismaMock.product.create).toHaveBeenCalledWith({ data: { ...input, teamId: TEAM } });
    });
  });

  describe('UPDATE (update)', () => {
    it('valida posse na equipe e então atualiza', async () => {
      (prismaMock.product.findFirst as any).mockResolvedValue({ id: 5, teamId: TEAM });
      const updated = { id: 5, name: 'Novo', teamId: TEAM };
      (prismaMock.product.update as any).mockResolvedValue(updated);

      const result = await productService.update(5, { name: 'Novo' }, TEAM);

      expect(result).toEqual(updated);
      // getById é chamado antes (guard de posse)
      expect(prismaMock.product.findFirst).toHaveBeenCalledWith({ where: { id: 5, teamId: TEAM } });
      expect(prismaMock.product.update).toHaveBeenCalledWith({ where: { id: 5 }, data: { name: 'Novo' } });
    });

    it('não atualiza produto de outra equipe (404 no guard)', async () => {
      (prismaMock.product.findFirst as any).mockResolvedValue(null);

      await expect(productService.update(5, { name: 'x' }, TEAM)).rejects.toMatchObject({ statusCode: 404 });
      expect(prismaMock.product.update).not.toHaveBeenCalled();
    });
  });
});
