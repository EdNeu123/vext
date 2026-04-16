import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const url = new URL(process.env.DATABASE_URL ?? 'postgresql://localhost');
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', '10');
    url.searchParams.set('pool_timeout', '20');
  }
  process.env.DATABASE_URL = url.toString();

  const logConfig: Prisma.LogDefinition[] = [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ];

  return new PrismaClient({ log: logConfig });
}

export const prisma: PrismaClient = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

(prisma.$on as any)('error', (e: Prisma.LogEvent) => {
  logger.error('Prisma error', { message: e.message, target: e.target });
});

(prisma.$on as any)('warn', (e: Prisma.LogEvent) => {
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
