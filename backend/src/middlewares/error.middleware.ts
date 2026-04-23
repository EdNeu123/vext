import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/helpers';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// Mapeamento de códigos Prisma para mensagens seguras (sem vazar schema)
const PRISMA_ERRORS: Record<string, { status: number; message: string }> = {
  P2002: { status: 409, message: 'Registro duplicado' },
  P2025: { status: 404, message: 'Registro não encontrado' },
  P2003: { status: 400, message: 'Referência inválida' },
  P2014: { status: 400, message: 'Violação de relação' },
  P2016: { status: 400, message: 'Erro de consulta' },
};

/**
 * Log rico — vai para console.error em produção (Vercel Runtime Logs),
 * mas NUNCA é enviado ao cliente. Permite diagnosticar 500s sem expor
 * detalhes sensíveis do stack via resposta HTTP.
 */
function logUnexpected(err: Error, req: Request): void {
  const ctx = {
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id ?? null,
    errorName: err.constructor.name,
    errorMessage: err.message,
    stack: err.stack,
  };
  // Usa tanto logger (Winston) quanto console.error para garantir captura no Vercel
  logger.error('[500] Erro não tratado', ctx);
  // eslint-disable-next-line no-console
  console.error('[500] Erro não tratado:', JSON.stringify(ctx, null, 2));
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  // Erros operacionais conhecidos
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  // Erros do Prisma — nunca expor detalhes do schema
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    const mapped = PRISMA_ERRORS[prismaError.code];
    if (mapped) {
      res.status(mapped.status).json({ success: false, message: mapped.message });
      return;
    }
    logger.error('Prisma error não mapeado', { code: prismaError.code, message: err.message });
    // eslint-disable-next-line no-console
    console.error('[Prisma] código não mapeado:', prismaError.code, err.message);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    return;
  }

  if (err.constructor.name === 'PrismaClientValidationError') {
    logger.error('Prisma validation error', { message: err.message });
    res.status(400).json({ success: false, message: 'Dados inválidos' });
    return;
  }

  // Erro específico do express-rate-limit v7+ quando keyGenerator retorna undefined
  if ((err as any).code === 'ERR_ERL_KEY_GEN_UNDEFINED') {
    logUnexpected(err, req);
    res.status(500).json({ success: false, message: 'Erro de configuração do servidor' });
    return;
  }

  // Erros de objeto inline (ex: do validate middleware)
  const inlineErr = err as any;
  if (inlineErr.statusCode && inlineErr.isOperational) {
    res.status(inlineErr.statusCode).json({ success: false, message: inlineErr.message });
    return;
  }

  // Erro inesperado — logga com stack completo no servidor, responde genérico ao cliente
  logUnexpected(err, req);

  res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message,
    // stack NUNCA enviado ao cliente
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
  });
}
