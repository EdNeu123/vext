# Matriz de Rastreabilidade — Requisitos × Testes

Mapeia os Requisitos Funcionais do vault **"Vext Requisitos"** aos testes de
aceitação automatizados (`tests/acceptance/`). Cada teste referencia, no nome do
`it`, o critério de aceitação (CA) que valida.

> Os testes de aceitação validam o **comportamento implementado** na camada de
> services. Critérios cuja implementação ainda diverge do vault estão marcados
> como `it.todo` no respectivo arquivo (rastreáveis, sem quebrar a suíte).

| RF | Título | Arquivo de teste | Status |
|----|--------|------------------|--------|
| RF-0001 | Registro de Usuário | `auth.rf.test.ts` | ✅ |
| RF-0002 | Autenticação de Usuário | `auth.rf.test.ts` | ✅ |
| RF-0003 | Renovação de Token de Acesso | `auth.rf.test.ts` | ✅ |
| RF-0004 | Logout de Usuário | `auth.rf.test.ts` | ✅ |
| RF-0007 | Alteração do Próprio Perfil | `auth.rf.test.ts` | ✅ |
| RF-0010 | Registrar Equipe (limites de plano) | `team.rf.test.ts` | ✅ |
| RF-0011 | Consulta de Equipe | `team.rf.test.ts` | ✅ |
| RF-0013 | Alteração de Equipe / Transferência de posse | `team.rf.test.ts` | ✅ |
| RF-0015 | Convidar Usuário para Equipe | `invite.rf.test.ts` | ✅ |
| RF-0016 | Remover Usuário da Equipe | `team.rf.test.ts` | ✅ |
| RF-0017 | Registro de Tag | `tag.rf.test.ts` | ✅ |
| RF-0018 | Consulta de Tag (usageCount) | `tag.rf.test.ts` | ✅ |
| RF-0019 | Listagem de Tags | `tag.rf.test.ts` | ✅ |
| RF-0020 | Alteração de Tag | `tag.rf.test.ts` | ✅ |
| RF-0021 | Deleção de Tag (soft/hard) | `tag.rf.test.ts` | ✅ |
| RF-0022 | Registrar Contato | `contact.rf.test.ts` | ✅ |
| RF-0023 | Consulta de Contato | `contact.rf.test.ts` | ✅ / ⚠️ escopo por perfil |
| RF-0024 | Listagem de Contatos | `contact.rf.test.ts` | ✅ |
| RF-0027 | Pesquisa de Contatos | `contact.rf.test.ts` | ✅ |
| RF-0032 | Registro de Card | `card.rf.test.ts` | ✅ |
| RF-0033 | Consulta de Card | `card.rf.test.ts` | ✅ |
| RF-0035 | Alteração de Card (eventos) | `card.rf.test.ts` | ✅ |
| RF-0037 | Movimentação de Card no Kanban | `card.rf.test.ts` | ✅ |
| RF-0038 | Registro de Tarefa | `task.rf.test.ts` | ✅ |
| RF-0039 | Consulta de Tarefa | `task.rf.test.ts` | ✅ |
| RF-0041 | Alteração de Tarefa (completedAt) | `task.rf.test.ts` | ✅ |
| RF-0042 | Deleção de Tarefa | `task.rf.test.ts` | ✅ |
| RF-0045 | Registro de Produto | `product.rf.test.ts` | ✅ |
| RF-0046 | Consulta de Produto | `product.rf.test.ts` | ✅ |
| RF-0047 | Listagem de Produtos | `product.rf.test.ts` | ✅ |
| RF-0048 | Alteração de Produto | `product.rf.test.ts` | ✅ |
| RF-0049 | Deleção de Produto | `product.rf.test.ts` | ✅ / ⚠️ hard-delete |

## Divergências registradas (it.todo)

São pontos onde o critério do vault descreve comportamento ainda não implementado
no service. Ficam visíveis no relatório do Vitest como `todo`, servindo de backlog:

1. **RF-0045** — Vault exige `nome` de 2 a 255 caracteres; o `createProductSchema`
   (Zod) usa `min(1)`. Alinhar o schema ao vault.
2. **RF-0049** — Vault exige *hard-delete* para produtos sem associação; o service
   atual sempre faz *soft-delete* (`isActive=false`).
3. **RF-0023/24/25/26** — Vault descreve escopo por **perfil** (SELLER vê só os
   seus, ADMIN vê todos). A implementação atual escopa por **equipe** (`teamId`),
   alinhada ao modelo multi-tenant. Decisão de arquitetura a confirmar.

## RFs não cobertos por teste de aceitação automatizado

- **RF-0005/0006** (consulta/listagem de membros) — exercitados indiretamente em
  `team.rf.test.ts` e nos testes unitários de `team.service`.
- **RF-0008/0009** (inativação de conta, recuperação de senha) — fluxos ainda não
  presentes como métodos isolados no `auth.service` atual.
- **RF-0028 a RF-0031** (KPIs, filtros, ranking) — pertencem ao `dashboard.service`
  (agregações); recomendado cobrir com testes de integração sobre dados semeados.
- **RF-0043/0044/0051** (notificação na UI, e-mail/Google Agenda, sugestão via IA)
  — dependem de integrações externas; fora do escopo de teste unitário.

## Resumo quantitativo

- **Testes unitários** (CRUD por entidade): `tests/unit/` — 8 arquivos
- **Testes de aceitação** (por RF): `tests/acceptance/` — 8 arquivos
- **Total:** 130 testes passando + 3 `todo` (divergências documentadas)
- **Cobertura de branches da camada de services:** ~84%
