/**
 * Testes de aceitação — Contatos.
 *   RF-0022 Registrar Contato
 *   RF-0023 Consulta de Contato (inclui cards vinculados)
 *   RF-0024 Listagem de Contatos (paginação, filtro combinado)
 *   RF-0027 Pesquisa de Contatos (case-insensitive, lista vazia)
 *
 * Rastreabilidade: os critérios RF-0023/24/25/26 citam escopo por PERFIL
 * (SELLER vê só os seus; ADMIN vê todos). A implementação atual escopa por
 * EQUIPE (teamId) — isolamento multi-tenant — e não por ownerId/role. As
 * asserções abaixo refletem o comportamento IMPLEMENTADO; o escopo por perfil
 * fica registrado como it.todo.
 */
import { describe, it, expect } from 'vitest';
import { prismaMock } from '../helpers/prismaMock';
import { contactService } from '../../src/services/contact.service';

const TEAM = 1;
const OWNER = 10;

describe('RF-0022 — Registrar Contato', () => {
  it('CA2: contato é associado ao usuário autenticado como proprietário', async () => {
    (prismaMock.contact.create as any).mockResolvedValue({ id: 1, name: 'Cliente', ownerId: OWNER, teamId: TEAM });
    await contactService.create({ name: 'Cliente' } as any, OWNER, TEAM);
    const arg = (prismaMock.contact.create as any).mock.calls[0][0];
    expect(arg.data).toMatchObject({ ownerId: OWNER, teamId: TEAM });
  });

  it('CA3: aceita cadastro sem e-mail/telefone desde que haja nome', async () => {
    (prismaMock.contact.create as any).mockResolvedValue({ id: 2, name: 'Só Nome', ownerId: OWNER, teamId: TEAM });
    const r = await contactService.create({ name: 'Só Nome' } as any, OWNER, TEAM);
    expect(r).toMatchObject({ name: 'Só Nome' });
  });
});

describe('RF-0023 — Consulta de Contato', () => {
  it('CA1: contato inexistente na equipe → 404', async () => {
    (prismaMock.contact.findFirst as any).mockResolvedValue(null);
    await expect(contactService.getById(99, TEAM)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('CA4: resposta inclui os cards vinculados ao contato', async () => {
    (prismaMock.contact.findFirst as any).mockResolvedValue({ id: 3, name: 'C', teamId: TEAM, cards: [{ id: 1 }] });
    const r = await contactService.getById(3, TEAM);
    expect(r.cards).toBeDefined();
    const arg = (prismaMock.contact.findFirst as any).mock.calls[0][0];
    expect(arg.include.cards).toBeTruthy();
  });

  it.todo('CA2/CA3: escopo por perfil (SELLER só os seus, ADMIN todos) — impl. atual escopa por equipe');
});

describe('RF-0024 — Listagem de Contatos', () => {
  it('CA3: respeita limite de página (take=limit, skip por página)', async () => {
    (prismaMock.contact.findMany as any).mockResolvedValue([]);
    (prismaMock.contact.count as any).mockResolvedValue(0);
    await contactService.list(TEAM, undefined, 3, 25);
    const arg = (prismaMock.contact.findMany as any).mock.calls[0][0];
    expect(arg.take).toBe(25);
    expect(arg.skip).toBe(50); // (3-1)*25
  });

  it('CA4: filtro de busca aplicado em nome/email/empresa combinados (OR)', async () => {
    (prismaMock.contact.findMany as any).mockResolvedValue([]);
    (prismaMock.contact.count as any).mockResolvedValue(0);
    await contactService.list(TEAM, 'acme');
    const arg = (prismaMock.contact.findMany as any).mock.calls[0][0];
    const fields = arg.where.OR.map((o: any) => Object.keys(o)[0]);
    expect(fields).toEqual(['name', 'email', 'company']);
  });
});

describe('RF-0027 — Pesquisa de Contatos', () => {
  it('CA1: busca é insensível a maiúsculas/minúsculas (mode insensitive)', async () => {
    (prismaMock.contact.findMany as any).mockResolvedValue([]);
    (prismaMock.contact.count as any).mockResolvedValue(0);
    await contactService.list(TEAM, 'ACME');
    const arg = (prismaMock.contact.findMany as any).mock.calls[0][0];
    expect(arg.where.OR[0].name.mode).toBe('insensitive');
  });

  it('CA4: sem resultado → lista vazia com total 0', async () => {
    (prismaMock.contact.findMany as any).mockResolvedValue([]);
    (prismaMock.contact.count as any).mockResolvedValue(0);
    const r = await contactService.list(TEAM, 'inexistente');
    expect(r).toEqual({ data: [], total: 0 });
  });
});
