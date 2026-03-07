-- ============================================================
--  01_init.sql — Inicialização do banco de homologação
--  Executado automaticamente na 1ª inicialização do container
--  Vext CRM v2.1.0
-- ============================================================

-- Garante extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- Busca por similaridade (contatos)
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- Busca ignorando acentos

-- Schema de aplicação isolado
CREATE SCHEMA IF NOT EXISTS vext;

-- Mensagem de inicialização
DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Vext CRM — Banco HML inicializado!';
  RAISE NOTICE 'Database: %', current_database();
  RAISE NOTICE 'Timestamp: %', now();
  RAISE NOTICE '====================================';
END $$;
