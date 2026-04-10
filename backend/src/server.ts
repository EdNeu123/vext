import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/prisma';
import { logger } from './config/logger';

async function bootstrap() {
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Vext CRM API v2.1 rodando na porta ${env.PORT}`);
    logger.info(`📚 Swagger: http://localhost:${env.PORT}/api/docs`);
    logger.info(`🏥 Health:  http://localhost:${env.PORT}/api/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} recebido. Encerrando...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Falha ao iniciar servidor', { error: err });
  process.exit(1);
});
