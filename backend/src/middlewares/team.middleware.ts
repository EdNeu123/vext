import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/helpers';
import type { AuthRequest } from '../types/express.d';

/**
 * Middleware de acesso à equipe.
 *
 * Lê o header X-Team-ID, valida que o usuário autenticado
 * é membro daquela equipe e injeta req.teamId + req.teamRole.
 *
 * DEVE ser usado APÓS authenticate() em todas as rotas de negócio.
 */
export async function requireTeamAccess(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawTeamId = req.headers['x-team-id'];
    if (!rawTeamId || Array.isArray(rawTeamId)) {
      return next(ApiError.badRequest('Header X-Team-ID obrigatório'));
    }

    const teamId = parseInt(rawTeamId, 10);
    if (isNaN(teamId)) return next(ApiError.badRequest('X-Team-ID inválido'));

    // Verifica se o usuário é membro desta equipe
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: req.user!.id } },
      select: { role: true },
    });

    if (!membership) {
      return next(ApiError.forbidden('Você não é membro desta equipe'));
    }

    req.teamId   = teamId;
    req.teamRole = membership.role as 'admin' | 'moderator' | 'seller';
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Exige que o usuário seja ADMIN (dono) da equipe.
 * Usar para: configurações da equipe, promover/rebaixar moderadores,
 * transferência de posse, exclusão da equipe.
 * Usar APÓS requireTeamAccess.
 */
export function requireTeamAdmin(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  if (req.teamRole !== 'admin') {
    return next(ApiError.forbidden('Acesso restrito ao administrador da equipe'));
  }
  next();
}

/**
 * Exige que o usuário seja ADMIN ou MODERATOR ("staff") da equipe.
 * Usar para: convidar membros, remover membros, gerenciar produtos/tags
 * da equipe (a checagem de "moderator não pode remover admin" é feita
 * no service, pois depende do alvo da operação, não só de quem chama).
 * Usar APÓS requireTeamAccess.
 */
export function requireTeamStaff(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  if (req.teamRole !== 'admin' && req.teamRole !== 'moderator') {
    return next(ApiError.forbidden('Acesso restrito a administradores ou moderadores da equipe'));
  }
  next();
}
