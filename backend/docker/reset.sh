#!/usr/bin/env bash
# ─────────────────────────────────────────────────
# Vext CRM v2.1 — dev:reset
# Destrói containers e volumes (banco limpo)
# ─────────────────────────────────────────────────
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

COMPOSE_FILE="docker/docker-compose.yml"

echo ""
echo -e "${YELLOW}⚠ Isso vai APAGAR todos os dados do banco local!${NC}"
read -p "Tem certeza? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
  echo -e "${GREEN}Cancelado.${NC}"
  exit 0
fi

echo -e "${YELLOW}Parando containers...${NC}"
docker compose -f "$COMPOSE_FILE" down -v --remove-orphans 2>&1

# Limpar migrações locais se existir pasta
if [ -d "prisma/migrations" ]; then
  echo -e "${YELLOW}Removendo pasta de migrações...${NC}"
  rm -rf prisma/migrations
fi

echo ""
echo -e "${GREEN}✅ Ambiente limpo! Execute 'npm run dev:init' para recomeçar.${NC}"
echo ""
