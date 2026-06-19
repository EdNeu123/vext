# Vext CRM v2.1

CRM completo com arquitetura MVC — REST API (Express + Prisma + PostgreSQL) e frontend React + TypeScript.

## Arquitetura

```
vext/
├── backend/                         # API REST (Node.js + Express MVC)
│   ├── prisma/
│   │   ├── schema.prisma            # Schema do banco (Prisma ORM)
│   │   ├── migrations/              # Histórico de migrações
│   │   └── seed.ts                  # Dados iniciais
│   ├── docker/
│   │   ├── docker-compose.yml       # PostgreSQL + pgAdmin
│   │   ├── setup.ts                 # Script de setup (cross-platform)
│   │   └── reset.ts                 # Script de reset completo
│   └── src/
│       ├── config/                  # env.ts (Zod), prisma.ts
│       ├── controllers/             # Camada C do MVC (thin controllers)
│       ├── services/                # Regras de negócio (SRP por domínio)
│       ├── middlewares/             # auth, validate (Zod+XSS), error
│       ├── models/                  # Schemas Zod
│       ├── routes/                  # Definição das rotas
│       ├── utils/                   # helpers, jwt, sanitize, logger
│       ├── docs/swagger.ts          # Swagger UI (dev only)
│       ├── app.ts                   # Express app
│       └── server.ts                # Entry point
│
└── frontend/                        # React 18 + TypeScript
    └── src/
        ├── components/              # Layout, UI, Pipeline, Calendar
        ├── pages/                   # Dashboard, Pipeline, Contacts...
        ├── services/                # api.ts (Axios + auto-refresh)
        ├── store/                   # Zustand (auth, team, ui)
        └── models/                  # Interfaces TypeScript
```

---

## Rodando com Docker (recomendado)

### Pré-requisitos

- [Docker Desktop](https://docs.docker.com/get-docker/) instalado e **rodando**
- Node.js 18+ e npm
- Git

### 1. Clone e configure as variáveis de ambiente

```bash
git clone https://github.com/EdNeu123/vext.git
cd vext/backend
cp .env.example .env
```

Edite o `.env` preenchendo os valores obrigatórios:

```env
# Docker / PostgreSQL
DOCKER_PG_USER="vext"
DOCKER_PG_PASSWORD="vext123"
DOCKER_PG_DB="vext_crm"
DOCKER_PG_PORT=5433

# pgAdmin
DOCKER_PGADMIN_PORT=5050
DOCKER_PGADMIN_EMAIL="admin@vext.com.br"
DOCKER_PGADMIN_PASSWORD="admin123"

# Banco (aponta pro container Docker)
DATABASE_URL="postgresql://vext:vext123@localhost:5433/vext_crm"

# JWT — use strings longas e aleatórias (mínimo 32 chars)
JWT_SECRET="troque-por-uma-string-aleatoria-de-pelo-menos-32-chars"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="outra-string-aleatoria-diferente-da-anterior-32chars"
REFRESH_TOKEN_EXPIRES_IN="7d"

# App
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:5173"
CORS_ORIGIN="http://localhost:5173"

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Senha do admin seed (obrigatória — mínimo 12 chars)
ADMIN_SEED_PASSWORD="SuaSenhaForte@2025"

# IA (opcional)
GEMINI_API_KEY=""
```

### 2. Instale as dependências e suba o ambiente

```bash
# Ainda em backend/
npm install

# Sobe o PostgreSQL + pgAdmin via Docker, aplica migrações e roda o seed
npm run dev:init
```

> Esse único comando faz tudo: cria os containers, aguarda o banco estar pronto, roda `prisma migrate deploy` e executa o seed.

### 3. Inicie o servidor backend

```bash
npm run dev
# API rodando em http://localhost:3001
```

### 4. Configure e inicie o frontend

```bash
cd ../frontend
npm install
cp .env.example .env
# Edite o .env:
# VITE_API_URL=http://localhost:3001/api

npm run dev
# Frontend rodando em http://localhost:5173
```

### 5. Acesse

| Serviço       | URL                             |
|---------------|---------------------------------|
| Frontend      | http://localhost:5173           |
| API           | http://localhost:3001/api       |
| Swagger UI    | http://localhost:3001/api/docs  |
| pgAdmin       | http://localhost:5050           |
| Prisma Studio | `npm run studio` (em backend/)  |

**Login padrão** (criado pelo seed):
```
Email: admin@vext.com.br
Senha: (o valor que você definiu em ADMIN_SEED_PASSWORD)
```

### Conectar o pgAdmin ao banco

1. Acesse `http://localhost:5050`
2. Clique em **Add New Server** → aba **Connection**:
   - Host: `vext-postgres`
   - Port: `5432`
   - Database: `vext_crm`
   - Username: `vext`
   - Password: `vext123`

---

## Scripts úteis (backend/)

| Comando             | Descrição                                        |
|---------------------|--------------------------------------------------|
| `npm run dev:init`  | Setup completo: Docker + migrate + seed          |
| `npm run dev:up`    | Sobe os containers sem migrate/seed              |
| `npm run dev:down`  | Para os containers (dados preservados)           |
| `npm run dev:reset` | Destrói tudo: containers, volumes e dados        |
| `npm run dev:logs`  | Acompanha logs do PostgreSQL em tempo real       |
| `npm run dev`       | Inicia a API em modo watch (hot reload)          |
| `npm run migrate`   | Cria/aplica uma nova migração                    |
| `npm run seed`      | Roda o seed novamente                            |
| `npm run studio`    | Abre o Prisma Studio (UI visual do banco)        |
| `npm test`          | Executa os testes                                |

### Troubleshooting

**Porta 5433 em uso:** altere `DOCKER_PG_PORT` no `.env` e atualize a porta no `DATABASE_URL`.

**Prisma não conecta:** verifique se o container está rodando com `docker ps`. Se não estiver: `npm run dev:up`.

**Resetar tudo do zero:**
```bash
npm run dev:reset  # apaga volumes e containers
npm run dev:init   # recria do zero
```

---

## Variáveis de Ambiente

### Backend (`backend/.env`)

| Variável                   | Descrição                                  | Obrigatória |
|----------------------------|--------------------------------------------|-------------|
| `DATABASE_URL`             | Connection string do PostgreSQL            | ✅           |
| `JWT_SECRET`               | Secret do access token (mín. 32 chars)    | ✅           |
| `JWT_EXPIRES_IN`           | Expiração do access token                  | `15m`       |
| `REFRESH_TOKEN_SECRET`     | Secret do refresh token (mín. 32 chars)   | ✅           |
| `REFRESH_TOKEN_EXPIRES_IN` | Expiração do refresh token                 | `7d`        |
| `CORS_ORIGIN`              | URLs permitidas (separadas por vírgula)    | ✅           |
| `ADMIN_SEED_PASSWORD`      | Senha do admin no seed (mín. 12 chars)    | ✅           |
| `GEMINI_API_KEY`           | Chave da API Gemini (IA — opcional)       | ❌           |

### Frontend (`frontend/.env`)

| Variável       | Descrição           | Default                      |
|----------------|---------------------|------------------------------|
| `VITE_API_URL` | URL base da API     | `http://localhost:3001/api`  |

---

## Endpoints da API

### Auth (público)
| Método | Rota                  | Descrição                          |
|--------|-----------------------|------------------------------------|
| POST   | `/api/auth/login`     | Login (retorna access + seta cookie refresh) |
| POST   | `/api/auth/register`  | Registro (com ou sem invite token) |
| POST   | `/api/auth/refresh`   | Renova access token via cookie     |
| GET    | `/api/invites/validate/:token` | Valida token de convite   |

### Auth (autenticado)
| Método | Rota                  | Descrição                  |
|--------|-----------------------|----------------------------|
| POST   | `/api/auth/logout`    | Revoga todos refresh tokens |
| GET    | `/api/auth/me`        | Perfil do usuário          |
| PUT    | `/api/auth/profile`   | Atualiza perfil            |

### CRUD (autenticado + X-Team-ID)
- `GET|POST /api/contacts` — Contatos (`?page=1&limit=20&search=`)
- `GET|POST|PUT|DELETE /api/cards` — Pipeline/Deals
- `GET|POST|PUT|DELETE /api/tasks` — Tarefas
- `GET|POST|PUT|DELETE /api/tags` — Tags
- `GET|POST|PUT|DELETE /api/products` — Produtos
- `GET|POST|PUT|DELETE /api/landing-pages` — Landing Pages
- `GET|POST /api/teams` — Equipes
- `GET|POST|PUT /api/invites` — Convites
- `GET|PUT /api/notifications` — Notificações
- `GET /api/dashboard/*` — Métricas do dashboard
- `GET /api/ai/vext-radar` — Inteligência de churn e recompra
- `GET /api/audit/*` — Logs de auditoria

### Utilitários
- Swagger UI: `http://localhost:3001/api/docs` *(somente em development)*
- Health check: `http://localhost:3001/api/health`

---

## Deploy

### Backend (Vercel)
```bash
cd backend
npm run build
vercel --prod
```

### Frontend (Firebase Hosting)
```bash
cd frontend
npm run build
firebase deploy
```

---

## Tech Stack

**Backend:** Node.js · TypeScript · Express · Prisma ORM · PostgreSQL · JWT (access + refresh) · Zod · Helmet · bcryptjs · Winston · Swagger

**Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · Zustand · TanStack Query · Axios · Recharts · Lucide Icons
