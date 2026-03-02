import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/helpers';
import { logger } from '../config/logger';
import { env } from '../config/env';

/**
 * Middleware: Tratamento global de erros
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Erros do Prisma
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Registro duplicado' });
      return;
    }
    if (prismaError.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Registro não encontrado' });
      return;
    }
  }

  // Log do erro real
  logger.error('Erro não tratado', {
    message: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : err.message,
  });
}

/**
 * Middleware: 404 Not Found
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.method} ${req.path}`,
  });
}
