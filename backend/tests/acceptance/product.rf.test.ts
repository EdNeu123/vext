/**
 * Testes de aceitação — Produtos.
 *   RF-0045 Registro de Produto
 *   RF-0046 Consulta de Produto
 *   RF-0047 Listagem de Produtos
 *   RF-0048 Alteração de Produto
 *   RF-0049 Deleção de Produto
 *
 * Observações de rastreabilidade (implementação atual x critério):
 *  - RF-0045 "preço > 0" e "nome 2..255": validados na borda (Zod
 *    createProductSchema: price.positive(), name.min(1)). A regra de comprimento
 *    mínimo do vault é 2; o schema usa min(1). Divergência registrada como it.todo.
 *  - RF-0048 "somente ADMIN": autorização é feita por middleware de rota
 *    (requireRole), fora do escopo do service — coberto em teste de rota/smoke.
 *  - RF-0049 "hard-delete para produtos sem associação": o service atual SEMPRE
 *    faz soft-delete (isActive=false). Divergência registrada como it.todo.
 */
import { describe, it, expect } from 'vitest';
import { prismaMock } from '../helpers/prismaMock';
import { productService } from '../../src/services/product.service';

const TEAM = 1;

describe('RF-0045 — Registro de Produto', () => {
  it('cria produto com teamId; isActive vem do default do banco', async () => {
    (prismaMock.product.create as any).mockResolvedValue({ id: 1, name: 'Plano', price: 99.9, isActive: true, teamId: TEAM });
    const r = await productService.create({ name: 'Plano', price: 99.9 } as any, TEAM);
    expect(r).toMatchObject({ name: 'Plano', isActive: true });
    const arg = (prismaMock.product.create as any).mock.calls[0][0];
    expect(arg.data).not.toHaveProperty('isActive'); // default @default(true)
  });

  it.todo('CA: nome deve ter entre 2 e 255 caracteres (schema usa min(1) — alinhar Zod ao vault)');
});

describe('RF-0046 — Consulta de Produto', () => {
  it('CA1: produto inexistente na equipe → 404', async () => {
    (prismaMock.product.findFirst as any).mockResolvedValue(null);
    await expect(productService.getById(99, TEAM)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('CA2: produto INATIVO é retornado na consulta direta por id', async () => {
    (prismaMock.product.findFirst as any).mockResolvedValue({ id: 5, name: 'Antigo', isActive: false, teamId: TEAM });
    const r = await productService.getById(5, TEAM);
    expect(r).toMatchObject({ id: 5, isActive: false });
    // getById não filtra por isActive — só por id+teamId
    const arg = (prismaMock.product.findFirst as any).mock.calls[0][0];
    expect(arg.where).toEqual({ id: 5, teamId: TEAM });
  });
});

describe('RF-0047 — Listagem de Produtos', () => {
  it('CA1: por padrão retorna apenas produtos ativos da equipe', async () => {
    (prismaMock.product.findMany as any).mockResolvedValue([]);
    await productService.list(TEAM);
    const arg = (prismaMock.product.findMany as any).mock.calls[0][0];
    expect(arg.where).toEqual({ isActive: true, teamId: TEAM });
  });
});

describe('RF-0048 — Alteração de Produto', () => {
  it('CA1: produto inexistente → 404 (guard antes do update)', async () => {
    (prismaMock.product.findFirst as any).mockResolvedValue(null);
    await expect(productService.update(9, { price: 10 }, TEAM)).rejects.toMatchObject({ statusCode: 404 });
    expect(prismaMock.product.update).not.toHaveBeenCalled();
  });

  it('atualiza preço de produto existente na equipe', async () => {
    (prismaMock.product.findFirst as any).mockResolvedValue({ id: 3, teamId: TEAM });
    (prismaMock.product.update as any).mockResolvedValue({ id: 3, price: 150 });
    const r = await productService.update(3, { price: 150 }, TEAM);
    expect(r).toMatchObject({ price: 150 });
  });
});

describe('RF-0049 — Deleção de Produto', () => {
  it('inativa o produto (soft-delete), preservando histórico', async () => {
    (prismaMock.product.findFirst as any).mockResolvedValue({ id: 4, teamId: TEAM });
    (prismaMock.product.update as any).mockResolvedValue({ id: 4, isActive: false });

    await productService.delete(4, TEAM);

    expect(prismaMock.product.update).toHaveBeenCalledWith({ where: { id: 4 }, data: { isActive: false } });
    expect(prismaMock.product.delete).not.toHaveBeenCalled();
  });

  it('CA3: produto inexistente → 404', async () => {
    (prismaMock.product.findFirst as any).mockResolvedValue(null);
    await expect(productService.delete(99, TEAM)).rejects.toMatchObject({ statusCode: 404 });
  });

  it.todo('CA2: produtos SEM associação deveriam ser removidos permanentemente (service atual só inativa)');
});
