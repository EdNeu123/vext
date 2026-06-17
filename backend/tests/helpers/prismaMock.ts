/**
 * Mock central do Prisma para testes unitários.
 *
 * Estratégia (à prova de hoisting do Vitest):
 *  - `vi.mock('../../src/config/prisma', factory)` é içado para o topo do módulo.
 *    A factory cria um DeepMockProxy<PrismaClient> e o expõe como `prisma`.
 *  - Recuperamos ESSE MESMO objeto via import dinâmico dentro de `getPrismaMock()`
 *    e o reexportamos como `prismaMock`, garantindo que service e teste usem a
 *    mesma instância.
 *  - `$transaction` é simulado nas duas formas: callback (interactive) e array.
 *
 * Uso no teste:
 *   import { prismaMock } from '../helpers/prismaMock';
 *   import { productService } from '../../src/services/product.service';
 */
import { vi, beforeEach } from 'vitest';
import { mockReset, type DeepMockProxy } from 'vitest-mock-extended';
import type { PrismaClient } from '@prisma/client';
import { prisma as mockedPrisma, connectDatabase, disconnectDatabase } from '../../src/config/prisma';

// Mock do módulo de config — a factory NÃO referencia variáveis externas
// (evita o erro "cannot access before initialization").
vi.mock('../../src/config/prisma', async () => {
  const { mockDeep } = await import('vitest-mock-extended');
  const prisma = mockDeep<PrismaClient>();
  (prisma.$transaction as any).mockImplementation(async (arg: any) => {
    if (typeof arg === 'function') return arg(prisma);
    if (Array.isArray(arg)) return Promise.all(arg);
    return undefined;
  });
  return { prisma, connectDatabase: vi.fn(), disconnectDatabase: vi.fn() };
});

// `mockedPrisma` agora É o deep mock criado na factory acima.
export const prismaMock = mockedPrisma as unknown as DeepMockProxy<PrismaClient>;

function installTransaction() {
  (prismaMock.$transaction as any).mockImplementation(async (arg: any) => {
    if (typeof arg === 'function') return arg(prismaMock);
    if (Array.isArray(arg)) return Promise.all(arg);
    return undefined;
  });
}

/** Reseta todos os stubs entre testes, mantendo o comportamento de $transaction. */
export function resetPrismaMock() {
  mockReset(prismaMock);
  installTransaction();
}

beforeEach(() => resetPrismaMock());
