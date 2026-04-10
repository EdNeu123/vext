import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// ─────────────────────────────────────────────────────────────────────────────
// Singleton para evitar múltiplas instâncias em hot-reload (desenvolvimento)
// e em ambientes serverless (Vercel).
// connection_limit: limita o pool para não esgotar conexões do PostgreSQL.
// Em produção, ajuste conforme o plano do banco (Oracle Free = ~15 conexões).
// ─────────────────────────────────────────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  // Adiciona connection_limit à URL se não estiver presente
  const url = new URL(process.env.DATABASE_URL ?? 'postgresql://localhost');
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', '10');
    url.searchParams.set('pool_timeout', '20');
  }
  process.env.DATABASE_URL = url.toString();

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? [{ emit: 'event', level: 'error' }, { emit: 'event', level: 'warn' }]
      : [{ emit: 'event', level: 'error' }],
  });
}

export const prisma: PrismaClient = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

prisma.$on('error', (e) => {
  logger.error('Prisma error', { message: e.message, target: e.target });
});

prisma.$on('warn', (e) => {
  logger.warn('Prisma warning', { message: e.message });
});

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('📦 Conexão com PostgreSQL estabelecida');
  } catch (error) {
    logger.error('❌ Falha na conexão com banco de dados', { error });
    if (process.env.NODE_ENV !== 'production') process.exit(1);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('📦 Conexão com banco encerrada');
}
