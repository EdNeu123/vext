#!/usr/bin/env bash
# ─────────────────────────────────────────────────
# Vext CRM v2.1 — dev:init
# Sobe o Docker, espera o PG, roda Prisma e Seed
# ─────────────────────────────────────────────────
set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

COMPOSE_FILE="docker/docker-compose.yml"

echo ""
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo -e "${CYAN}   🚀 Vext CRM — Setup do Ambiente Local   ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo ""

# ── 1. Verificar Docker ────────────────────────
echo -e "${YELLOW}[1/6]${NC} Verificando Docker..."
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker não encontrado! Instale em: https://docs.docker.com/get-docker/${NC}"
  exit 1
fi

if ! docker info &> /dev/null; then
  echo -e "${RED}❌ Docker daemon não está rodando! Inicie o Docker Desktop.${NC}"
  exit 1
fi

echo -e "  ${GREEN}✔ Docker OK${NC}"

# ── 2. Verificar .env ──────────────────────────
echo -e "${YELLOW}[2/6]${NC} Verificando .env..."
if [ ! -f .env ]; then
  echo -e "  ${YELLOW}⚠ Arquivo .env não encontrado. Copiando .env.example → .env${NC}"
  cp .env.example .env
  echo -e "  ${GREEN}✔ .env criado — revise as variáveis se necessário${NC}"
else
  echo -e "  ${GREEN}✔ .env já existe${NC}"
fi

# ── 3. Subir containers ───────────────────────
echo -e "${YELLOW}[3/6]${NC} Subindo containers Docker..."
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans 2>&1

echo -e "  ${GREEN}✔ Containers iniciados${NC}"

# ── 4. Aguardar PostgreSQL ────────────────────
echo -e "${YELLOW}[4/6]${NC} Aguardando PostgreSQL ficar pronto..."

MAX_RETRIES=30
RETRY=0

until docker exec vext-postgres pg_isready -U vext -d vext_crm &> /dev/null; do
  RETRY=$((RETRY + 1))
  if [ $RETRY -ge $MAX_RETRIES ]; then
    echo -e "${RED}❌ PostgreSQL não ficou pronto em tempo hábil.${NC}"
    echo -e "${RED}   Execute: docker logs vext-postgres${NC}"
    exit 1
  fi
  echo -ne "  ⏳ Tentativa $RETRY/$MAX_RETRIES...\r"
  sleep 2
done

echo -e "  ${GREEN}✔ PostgreSQL pronto na porta 5433${NC}"

# ── 5. Prisma (generate + migrate + seed) ─────
echo -e "${YELLOW}[5/6]${NC} Executando Prisma..."

echo -e "  📦 prisma generate..."
npx prisma generate 2>&1

echo -e "  📦 prisma migrate dev..."
npx prisma migrate dev --name init 2>&1

echo -e "  ${GREEN}✔ Migrações aplicadas${NC}"

# ── 6. Seed ───────────────────────────────────
echo -e "${YELLOW}[6/6]${NC} Populando banco com dados iniciais..."
npx tsx prisma/seed.ts 2>&1

echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ Ambiente configurado com sucesso!     ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}PostgreSQL:${NC}  localhost:5433"
echo -e "  ${CYAN}pgAdmin:${NC}     http://localhost:5050"
echo -e "  ${CYAN}             Email: admin@vext.com.br${NC}"
echo -e "  ${CYAN}             Senha: admin123${NC}"
echo ""
echo -e "  ${CYAN}Próximo passo:${NC} npm run dev"
echo ""
