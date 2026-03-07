# ============================================================
#  Vext CRM — PostgreSQL Homologação
#  Imagem base: postgres:16-alpine (leve e estável)
# ============================================================
FROM postgres:16-alpine

# ---------- Labels de identificação ----------
LABEL maintainer="Vext CRM Team"
LABEL environment="homologacao"
LABEL version="2.1.0"

# ---------- Variáveis de ambiente padrão para homologação ----------
# Valores são sobrescritos pelo docker-compose ou pelo .env
ENV POSTGRES_USER=${POSTGRES_USER:-vext_hml}
ENV POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-vext_hml_secret}
ENV POSTGRES_DB=${POSTGRES_DB:-vextcrm_hml}
ENV PGDATA=/var/lib/postgresql/data/pgdata

# ---------- Diretório de inicialização ----------
# Scripts .sql e .sh colocados aqui são executados na 1ª inicialização
COPY ./init/ /docker-entrypoint-initdb.d/

# ---------- Configurações de performance para homologação ----------
# Arquivo customizado de postgresql.conf sobrescreve padrões
COPY ./postgresql.hml.conf /etc/postgresql/postgresql.conf

# ---------- Volume para persistência dos dados ----------
VOLUME ["/var/lib/postgresql/data/pgdata"]

# ---------- Porta padrão PostgreSQL ----------
EXPOSE 5432

# ---------- Healthcheck ----------
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" || exit 1
