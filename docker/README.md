# 🐘 Vext CRM — PostgreSQL Docker (Homologação)

Guia completo para subir o banco de dados PostgreSQL em ambiente de **homologação** usando Docker e Docker Compose.

---

## 📁 Estrutura dos Arquivos

```
docker/
├── Dockerfile                  # Imagem customizada do PostgreSQL 16
├── docker-compose.yml          # Orquestração dos serviços
├── postgresql.hml.conf         # Configurações otimizadas para HML
├── .env.hml.example            # Modelo de variáveis de ambiente
├── init/
│   └── 01_init.sql             # Script de inicialização automática
└── pgadmin/
    └── servers.json            # Configuração automática do pgAdmin
```

---

## ✅ Pré-requisitos

| Ferramenta | Versão mínima | Verificar |
|---|---|---|
| Docker | 24.x | `docker --version` |
| Docker Compose | 2.x (plugin) | `docker compose version` |
| (Opcional) psql | 15+ | `psql --version` |

> **Atenção:** Use `docker compose` (com espaço) e não `docker-compose` (com hífen). A versão com hífen é legada e não é mais mantida.

---

## 🚀 Passo a Passo

### 1. Clone ou posicione-se na raiz do projeto

```bash
cd /caminho/para/vext-crm
```

---

### 2. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com seus valores:

```bash
cp docker/.env.hml.example docker/.env.hml
```

Abra `docker/.env.hml` e ajuste as variáveis:

```env
POSTGRES_USER=vext_hml
POSTGRES_PASSWORD=sua_senha_segura_aqui
POSTGRES_DB=vextcrm_hml
POSTGRES_PORT=5433
```

> ⚠️ **Nunca versione o `.env.hml` com senhas reais.** O `.env.hml.example` já está no `.gitignore`.

---

### 3. Suba o banco de dados

```bash
# Entre na pasta docker e rode de dentro dela:
cd docker
docker compose --env-file .env.hml up -d
```

O que acontece nesta etapa:
- Docker constrói a imagem `vextcrm_postgres_hml` a partir do `Dockerfile`
- O container inicia e executa `docker/init/01_init.sql` automaticamente
- O banco fica disponível na porta `5433` do seu host
- Os dados são persistidos no volume `vextcrm_postgres_hml_data`

---

### 4. Verifique se o container está saudável

```bash
docker compose -f docker/docker-compose.yml ps
```

Saída esperada:

```
NAME                      STATUS
vextcrm_postgres_hml      Up (healthy)
```

Se o status for `starting`, aguarde ~15 segundos e repita o comando.

---

### 5. Teste a conexão com o banco

**Via Docker exec (sem precisar do psql instalado localmente):**

```bash
docker exec -it vextcrm_postgres_hml \
  psql -U vext_hml -d vextcrm_hml -c "SELECT version();"
```

**Via psql local:**

```bash
psql -h localhost -p 5433 -U vext_hml -d vextcrm_hml
```

---

### 6. Configure o Prisma para apontar para o banco HML

No arquivo `.env` do seu backend, use a string de conexão:

```env
DATABASE_URL="postgresql://vext_hml:sua_senha@localhost:5433/vextcrm_hml?schema=public"
```

Execute as migrações Prisma:

```bash
cd backend
npx prisma migrate deploy
```

Ou, se estiver em desenvolvimento ativo:

```bash
npx prisma migrate dev --name init
```

---

## 🖥️ pgAdmin (Interface Gráfica) — Opcional

Para subir o pgAdmin junto com o banco:

```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env.hml \
  --profile pgadmin up -d
```

Acesse: **http://localhost:5050**

| Campo | Valor padrão |
|---|---|
| E-mail | `admin@vextcrm.hml` |
| Senha | `admin123` |

> O servidor `Vext CRM — Homologação` já estará pré-configurado automaticamente via `pgadmin/servers.json`. Basta informar a senha do banco quando solicitado.

---

## 🛑 Comandos Úteis

### Parar os containers (mantém dados)

```bash
docker compose -f docker/docker-compose.yml down
```

### Parar e **remover todos os dados** (reset completo)

```bash
docker compose -f docker/docker-compose.yml down -v
```

> ⚠️ `-v` remove os volumes. Use com cuidado — **todos os dados serão perdidos**.

### Ver logs em tempo real

```bash
docker logs -f vextcrm_postgres_hml
```

### Reconstruir a imagem do zero (após mudanças no Dockerfile)

```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env.hml \
  up -d --build
```

### Abrir terminal dentro do container

```bash
docker exec -it vextcrm_postgres_hml bash
```

---

## 🔁 Fluxo Resumido

```
.env.hml.example
      │
      ▼ (copiar e editar)
  .env.hml
      │
      ▼
docker compose up -d
      │
      ├─▶ Build da imagem (Dockerfile)
      ├─▶ Inicia container postgres_hml
      ├─▶ Executa init/01_init.sql
      └─▶ Banco disponível em localhost:5433
                │
                ▼
        DATABASE_URL no .env do backend
                │
                ▼
        npx prisma migrate deploy
                │
                ▼
        ✅ Banco pronto para usar
```

---

## 🗄️ Informações do Banco

| Parâmetro | Valor padrão (HML) |
|---|---|
| Host | `localhost` |
| Porta (host) | `5433` |
| Usuário | `vext_hml` |
| Database | `vextcrm_hml` |
| Schema Prisma | `public` |
| Versão PostgreSQL | `16` (Alpine) |

---

## 🔐 Segurança

- As credenciais de homologação **nunca** devem ser usadas em produção
- O arquivo `.env.hml` está no `.gitignore` e **não deve ser versionado**
- A porta `5433` exposta é apenas para acesso local — em produção, remova o mapeamento de portas e use a rede Docker interna
- Em produção, o banco é hospedado na **Oracle Cloud** conforme `RT-11` dos requisitos técnicos

---

## ❓ Troubleshooting

### Container sai imediatamente ao subir

```bash
docker logs vextcrm_postgres_hml
```

Verifique se a senha no `.env.hml` não contém caracteres especiais sem escape.

### Porta 5433 já em uso

Altere `POSTGRES_PORT` no `.env.hml` para outra porta disponível, ex: `5434`.

### Erro de permissão no volume

```bash
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml --env-file docker/.env.hml up -d
```

### Prisma não conecta

Confirme que `DATABASE_URL` usa `localhost` (não `postgres_hml`) quando conectando de **fora** do Docker. Use `postgres_hml` apenas quando o backend também estiver rodando dentro do Docker na mesma rede.

---

*Vext CRM v2.1.0 — Ambiente de Homologação*
