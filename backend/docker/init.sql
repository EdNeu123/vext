-- ─────────────────────────────────────────────
-- Vext CRM — Inicialização do banco (Docker)
-- Executado apenas na PRIMEIRA vez que o volume é criado
-- ─────────────────────────────────────────────

-- Extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- busca textual com LIKE/ILIKE otimizado

-- Confirmação no log do container
DO $$
BEGIN
  RAISE NOTICE '✅ Banco vext_crm inicializado com sucesso!';
END
$$;
