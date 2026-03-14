# Docker — Ambiente Local

Configuração Docker para desenvolvimento local do Vext CRM.

## Pré-requisitos

- [Docker Desktop](https://docs.docker.com/get-docker/) instalado e **rodando**
- Node.js 18+ e npm

## Início rápido

```bash
# Na pasta backend/
npm install         # instalar dependências Node
npm run dev:init    # sobe Docker + Prisma + Seed (primeira vez)
npm run dev         # inicia o servidor em modo watch
```

## Serviços

| Serviço    | URL                       | Credenciais                      |
|------------|---------------------------|----------------------------------|
| PostgreSQL | `localhost:5433`          | `vext` / `vext123`               |
| pgAdmin    | `http://localhost:5050`   | `admin@vext.com.br` / `admin123` |

### Conectar pgAdmin ao PostgreSQL

1. Acesse `http://localhost:5050`
2. **Add New Server** → aba _Connection_:
   - Host: `vext-postgres` (nome do container)
   - Port: `5432` (porta interna do container)
   - Database: `vext_crm`
   - Username: `vext`
   - Password: `vext123`

## Scripts disponíveis

| Comando              | Descrição                                      |
|----------------------|------------------------------------------------|
| `npm run dev:init`   | Setup completo: Docker + migrate + seed        |
| `npm run dev:up`     | Sobe apenas os containers (sem migrate/seed)   |
| `npm run dev:down`   | Para os containers (dados preservados)         |
| `npm run dev:reset`  | Destrói tudo (containers + volumes + dados)    |
| `npm run dev:logs`   | Acompanha logs do PostgreSQL em tempo real     |
| `npm run studio`     | Abre Prisma Studio (UI para o banco)           |
| `npm run migrate`    | Cria/aplica nova migração                      |
| `npm run seed`       | Roda seed no banco                             |

## Estrutura

```
docker/
├── docker-compose.yml   # Definição dos serviços
├── init.sql             # SQL executado na criação do banco
├── postgresql.conf      # Config do PostgreSQL para dev
├── setup.ts             # Script do dev:init (cross-platform)
├── reset.ts             # Script do dev:reset (cross-platform)
└── README.md            # Este arquivo
```

## Troubleshooting

**Porta 5433 em uso:**
Altere `DOCKER_PG_PORT` no `.env` para outra porta e atualize a porta no `DATABASE_URL`.

**Prisma não conecta:**
Verifique se o container está rodando: `docker ps`. Se não estiver, rode `npm run dev:up`.

**Limpar tudo e recomeçar:**
```bash
npm run dev:reset   # apaga volumes
npm run dev:init    # recria do zero
```
