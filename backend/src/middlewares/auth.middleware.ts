import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { ApiError } from '../utils/helpers';

export interface AuthPayload {
  userId: number;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * Middleware: Verifica JWT e injeta usuário no request
 */
export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      throw ApiError.unauthorized('Token de autenticação não fornecido');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;

    prisma.user
      .findUnique({ where: { id: decoded.userId, isActive: true } })
      .then((user) => {
        if (!user) {
          return next(ApiError.unauthorized('Usuário não encontrado ou inativo'));
        }

        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };

        next();
      })
      .catch(next);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized('Token expirado'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(ApiError.unauthorized('Token inválido'));
    } else {
      next(error);
    }
  }
}

/**
 * Middleware: Verifica se usuário é admin
 */
export function authorizeAdmin(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    return next(ApiError.forbidden('Acesso restrito a administradores'));
  }
  next();
}

/**
 * Gera Access Token (curto: 15min)
 */
export function generateAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * Gera Refresh Token (longo: 7d) e salva no banco
 */
export async function generateRefreshToken(userId: number): Promise<string> {
  const token = crypto.randomBytes(64).toString('hex');

  // Calcula expiração com base na config (ex: "7d")
  const match = env.REFRESH_TOKEN_EXPIRES_IN.match(/^(\d+)([dhms])$/);
  const value = match ? parseInt(match[1]) : 7;
  const unit = match ? match[2] : 'd';

  const expiresAt = new Date();
  switch (unit) {
    case 'd': expiresAt.setDate(expiresAt.getDate() + value); break;
    case 'h': expiresAt.setHours(expiresAt.getHours() + value); break;
    case 'm': expiresAt.setMinutes(expiresAt.getMinutes() + value); break;
    default: expiresAt.setDate(expiresAt.getDate() + 7);
  }

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
}

/**
 * Valida e rotaciona refresh token
 */
export async function rotateRefreshToken(oldToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: oldToken },
    include: { user: true },
  });

  if (!stored || stored.revoked || new Date() > stored.expiresAt || !stored.user.isActive) {
    // Se o token já foi usado (potencial roubo), revoga todos do usuário
    if (stored && stored.revoked) {
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId },
        data: { revoked: true },
      });
    }
    return null;
  }

  // Revoga o token atual
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked: true },
  });

  // Gera novos tokens
  const accessToken = generateAccessToken({
    userId: stored.user.id,
    email: stored.user.email,
    role: stored.user.role,
  });

  const refreshToken = await generateRefreshToken(stored.user.id);

  return { accessToken, refreshToken };
}

/**
 * Revoga todos os refresh tokens de um usuário (logout)
 */
export async function revokeAllRefreshTokens(userId: number): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
}
