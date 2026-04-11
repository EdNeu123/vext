import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/helpers';
import type { AuthRequest, AuthPayload } from '../types/express.d';

/**
 * Middleware de autenticação — valida o JWT localmente (sem DB query).
 *
 * O payload do token já contém id, email e role assinados pelo servidor.
 * A verificação de "usuário ainda existe/ativo" só é feita no login/refresh,
 * evitando uma DB query em cada requisição autenticada (causa do esgotamento
 * de conexões com 3+ usuários simultâneos).
 *
 * Para forçar logout imediato (ex: desativar usuário), use revogação de
 * refresh token — o access token expira em 15min naturalmente.
 */
export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) throw ApiError.unauthorized('Token de autenticação não fornecido');

    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: (decoded as any).name ?? '',
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError)      next(ApiError.unauthorized('Token expirado'));
    else if (error instanceof jwt.JsonWebTokenError) next(ApiError.unauthorized('Token inválido'));
    else next(error);
  }
}

export function authorizeAdmin(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    return next(ApiError.forbidden('Acesso restrito a administradores'));
  }
  next();
}
