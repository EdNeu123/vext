# Testes — Vext CRM Backend

Estratégia de testes da camada de **services** (regra de negócio que materializa
os Requisitos Funcionais e Não Funcionais do projeto).

## Ferramentas

| Ferramenta | Papel |
|---|---|
| **Vitest** | Runner + asserções + mocks. Nativo do ecossistema Vite/TS. |
| **vitest-mock-extended** | Deep-mock tipado do `PrismaClient` — testes unitários sem banco real. |
| **@vitest/coverage-v8** | Relatório de cobertura (text/html/lcov). |
| **Supertest** | Testes de borda HTTP (smoke) sobre o app Express. |

## Estrutura

```
tests/
├── setup.ts                 # env mínimo p/ os testes (NODE_ENV, JWT secrets…)
├── helpers/
│   └── prismaMock.ts        # mock central do Prisma + simulação de $transaction
├── unit/                    # testes unitários por entidade de banco
│   ├── product.service.test.ts
│   ├── contact.service.test.ts
│   ├── tag.service.test.ts
│   ├── card.service.test.ts
│   ├── task.service.test.ts
│   ├── landing-page.service.test.ts
│   ├── invite.service.test.ts
│   └── team.service.test.ts
├── acceptance/              # testes baseados nos Critérios de Aceitação dos RFs
│   ├── auth.rf.test.ts      # RF-0001..0004, 0007
│   ├── team.rf.test.ts      # RF-0010, 0011, 0013, 0016
│   ├── invite.rf.test.ts    # RF-0015
│   ├── tag.rf.test.ts       # RF-0017..0021
│   ├── contact.rf.test.ts   # RF-0022, 0023, 0024, 0027
│   ├── card.rf.test.ts      # RF-0032, 0033, 0035, 0037
│   ├── task.rf.test.ts      # RF-0038, 0039, 0041, 0042
│   └── product.rf.test.ts   # RF-0045..0049
├── RASTREABILIDADE.md       # matriz Requisito × Teste (para o TCC)
└── smoke.test.ts            # boot do app, CORS, 401 em rotas protegidas (requer Prisma gerado)
```

## Como rodar

```bash
npm run test:unit       # só os testes unitários (não precisam de banco)
npm run test:coverage   # unitários + relatório de cobertura em ./coverage
npm test                # tudo (smoke exige `npx prisma generate` antes)
```

> **Nota:** os testes unitários NÃO acessam PostgreSQL — o Prisma é 100% mockado.
> Já o `smoke.test.ts` importa o app real, então exige `npx prisma generate`
> concluído (engine do Prisma instalada) para rodar.

## O que cada teste cobre

Para **cada entidade de banco** validamos as quatro operações pedidas:

- **POST (create)** — injeção de `teamId`/`ownerId`, regras de unicidade
  (slug, label de tag), e — onde há múltiplas escritas — execução dentro de
  `prisma.$transaction` (card+tags+auditoria, task+auditoria, etc.).
- **UPDATE (update)** — guard de posse por equipe (404 fora da equipe),
  re-sincronização de tags, gravação de auditoria atômica.
- **GET ALL (list)** — escopo por `teamId`, paginação, filtros de busca,
  mapeamento de `_count` → `usageCount`.
- **GET (getById/validate/usage)** — retorno escopado e 404 quando o recurso
  pertence a outra equipe.

## Transações (atomicidade)

As operações com múltiplas escritas foram envolvidas em `prisma.$transaction`
(callback / interactive transaction). O mock em `helpers/prismaMock.ts` executa
o callback usando o próprio mock como `tx`, permitindo asserir que as escritas
(`tx.auditLog.create`, `tx.cardTag.createMany`, etc.) ocorrem dentro da transação.

Services com transação adicionada:
`card` (create/update/delete), `task` (create/update/delete),
`landing-page` (create/update/delete), `invite` (create/revoke),
`auth` (register — fluxo de aceite de convite), além de `team.create` (já existente).
