// Setup global dos testes — roda antes de cada arquivo de teste.
// Não conecta no banco, não levanta server real.

process.env.NODE_ENV = 'test';

// Variáveis mínimas pra config/env.ts não reclamar.
// Em testes de integração reais (com DB) o usuário pode sobrescrever.
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5433/vext_test';
process.env.JWT_SECRET ||= 'test-jwt-secret-min-32-chars-aaaaaaaaaaaa';
process.env.REFRESH_TOKEN_SECRET ||= 'test-refresh-secret-min-32-chars-bbbbbbbb';
process.env.CORS_ORIGIN ||= 'http://localhost:5173,https://vext-app.web.app';
process.env.ADMIN_SEED_PASSWORD ||= 'TestPass@2025!';
