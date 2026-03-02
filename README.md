# Vext CRM v2.1

CRM completo com arquitetura MVC — REST API (Express + Prisma + PostgreSQL) e frontend React + TypeScript.

## Melhorias v2.1

### 🔴 Segurança (Alta Prioridade)
- **Refresh Token** com rotação automática (access token 15min + refresh token 7d)
- **Sanitização XSS** em todos os inputs via middleware
- **Logs estruturados** com Winston (dev: colorido terminal / prod: JSON)
- **Senha do seed** configurável via variável de ambiente (`ADMIN_SEED_PASSWORD`)
- **Graceful shutdown** no servidor

### 🟡 Qualidade de Código (Média Prioridade)
- **Services separados** (SRP): team, invite, notification, dashboard, landing-page — cada um em seu próprio arquivo
- **Paginação real** em Contacts, Deals e Tasks com `skip/take` do Prisma
- **Todas as páginas implementadas** com CRUD completo:
  - Pipeline: Kanban board com drag-and-drop nativo
  - Contatos: tabela com busca, paginação, criação e edição
  - Agenda: calendário com tarefas por data
  - Produtos: CRUD completo com ativação/desativação
  - Tags: gerenciamento com color picker
  - Equipe: membros, ranking de vendedores, convites
  - Landing Pages: CRUD com analytics (views, conversões, taxa)
  - Vext Radar: dashboard de inteligência (churn + recompra)

### 🟢 Melhorias Estratégicas
- **Zustand** como state manager global (substituiu AuthContext + prop drilling)
- **Auto-refresh de token** transparente no interceptor do Axios
- **Notificações** no header com popover e contagem de não-lidas
- **Dashboard expandido** com 8 métricas + pipeline por etapa

## Arquitetura

```
vext-crm-v2/
├── backend/                        # API REST (Express MVC)
│   ├── prisma/
│   │   ├── schema.prisma           # Schema com RefreshToken model
│   │   └── seed.ts                 # Seed com senha segura
│   └── src/
│       ├── config/
│       │   ├── database.ts         # Prisma client
│       │   ├── env.ts              # Zod validation
│       │   └── logger.ts           # Winston logger
│       ├── controllers/            # 7 controllers separados
│       ├── middlewares/
│       │   ├── auth.middleware.ts   # JWT + Refresh Token
│       │   ├── error.middleware.ts  # Error handler + Winston
│       │   └── validate.middleware.ts # Zod + XSS sanitization
│       ├── models/schemas.ts       # Zod schemas
│       ├── routes/index.ts         # 45+ endpoints
│       ├── services/               # 11 services (SRP)
│       ├── utils/
│       │   ├── helpers.ts          # ApiError, pagination, BANT
│       │   └── sanitize.ts         # XSS sanitizer
│       ├── docs/swagger.ts
│       ├── app.ts
│       └── server.ts
│
├── frontend/                       # React + TypeScript
│   └── src/
│       ├── components/
│       │   ├── CRMLayout.tsx       # Layout com notificações
│       │   └── Modal.tsx           # Modal reutilizável
│       ├── stores/
│       │   └── useAppStore.ts      # Zustand global store
│       ├── pages/                  # 11 páginas completas
│       ├── services/
│       │   ├── api.ts              # Axios + auto-refresh
│       │   └── index.ts            # Service layer
│       ├── models/index.ts         # TypeScript interfaces
│       ├── utils/format.ts         # Formatação BR
│       ├── App.tsx
│       └── main.tsx
```

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env           # Configure DATABASE_URL e secrets
npx prisma migrate dev         # Cria tabelas
npx prisma generate            # Gera client
npm run seed                   # Popula dados iniciais
npm run dev                    # http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env           # Configure VITE_API_URL
npm run dev                    # http://localhost:5173
```

## Variáveis de Ambiente

### Backend (.env)
| Variável | Descrição | Default |
|---|---|---|
| `DATABASE_URL` | URL do PostgreSQL | — |
| `JWT_SECRET` | Secret do access token (32+ chars) | — |
| `JWT_EXPIRES_IN` | Expiração do access token | `15m` |
| `REFRESH_TOKEN_SECRET` | Secret do refresh token (32+ chars) | — |
| `REFRESH_TOKEN_EXPIRES_IN` | Expiração do refresh token | `7d` |
| `CORS_ORIGIN` | URLs permitidas (separadas por vírgula) | `http://localhost:5173` |
| `ADMIN_SEED_PASSWORD` | Senha do admin no seed | `VextAdmin@2025!` |

### Frontend (.env)
| Variável | Descrição | Default |
|---|---|---|
| `VITE_API_URL` | URL base da API | `/api` |

## Endpoints da API

### Auth (Público)
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Login (retorna access + refresh token) |
| POST | `/api/auth/register` | Registro |
| POST | `/api/auth/refresh` | Renova tokens |

### Auth (Protegido)
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/logout` | Revoga todos refresh tokens |
| GET | `/api/auth/me` | Perfil do usuário |
| PUT | `/api/auth/profile` | Atualizar perfil |

### CRUD Completo (Protegido)
- `/api/contacts` — Contatos (com paginação: `?page=1&limit=20`)
- `/api/deals` — Deals/Pipeline (com paginação)
- `/api/tasks` — Tarefas (com paginação)
- `/api/tags` — Tags
- `/api/products` — Produtos (admin para criar/editar/deletar)
- `/api/landing-pages` — Landing Pages
- `/api/team` — Equipe
- `/api/invites` — Convites (admin)
- `/api/notifications` — Notificações
- `/api/dashboard` — Métricas do dashboard
- `/api/ai/vext-radar` — Inteligência de churn/recompra
- `/api/audit` — Logs de auditoria

### Documentação Interativa
- Swagger UI: `http://localhost:3001/api/docs`
- Health check: `http://localhost:3001/api/health`

## Credenciais Padrão

```
Email: admin@vext.com.br
Senha: VextAdmin@2025!
```

## Deploy

### Backend (Vercel)
```bash
cd backend && npm run build
vercel --prod
```

### Frontend (Firebase)
```bash
cd frontend && npm run build
firebase deploy
```

## Tech Stack

**Backend:** Express, Prisma, PostgreSQL, JWT + Refresh Token, Zod, Winston, XSS sanitization, Swagger  
**Frontend:** React 18, TypeScript, Tailwind CSS, Zustand, React Query, Axios (auto-refresh), Recharts, Lucide Icons
