import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/helpers';
import { logger } from '../config/logger';
import { env } from '../config/env';

// Mapeamento de códigos Prisma para mensagens seguras (sem vazar schema)
const PRISMA_ERRORS: Record<string, { status: number; message: string }> = {
  P2002: { status: 409, message: 'Registro duplicado' },
  P2025: { status: 404, message: 'Registro não encontrado' },
  P2003: { status: 400, message: 'Referência inválida' },
  P2014: { status: 400, message: 'Violação de relação' },
  P2016: { status: 400, message: 'Erro de consulta' },
};

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
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
    // Código não mapeado — loga internamente, responde genérico
    logger.error('Prisma error não mapeado', { code: prismaError.code });
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    return;
  }

  if (err.constructor.name === 'PrismaClientValidationError') {
    res.status(400).json({ success: false, message: 'Dados inválidos' });
    return;
  }

  // Erros de objeto inline (ex: do validate middleware)
  const inlineErr = err as any;
  if (inlineErr.statusCode && inlineErr.isOperational) {
    res.status(inlineErr.statusCode).json({ success: false, message: inlineErr.message });
    return;
  }

  // Erro inesperado — loga com stack, nunca expõe em produção
  logger.error('Erro não tratado', {
    message: err.message,
    stack: err.stack,
    name: err.constructor.name,
  });

  res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message,
    // stack NUNCA enviado ao cliente, nem em dev
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    // Não retornar req.method + req.path — evita enumeração de rotas
  });
}
