import { hashPassword, comparePassword } from '../utils/hash';
import { prisma } from '../config/prisma';
import {
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
  revokeAllRefreshTokens,
} from '../utils/jwt';
import { ApiError } from '../utils/helpers';
import { teamService } from './team.service';
import type { LoginInput, RegisterInput } from '../models/schemas';

export class AuthService {
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw ApiError.unauthorized('Credenciais inválidas');
    if (!user.isActive) throw ApiError.forbidden('Sua conta está bloqueada');

    const isValid = await comparePassword(input.password, user.password);
    if (!isValid) throw ApiError.unauthorized('Credenciais inválidas');

    await prisma.user.update({
      where: { id: user.id },
      data: { lastSignedIn: new Date() },
    });

    const accessToken  = generateAccessToken({
      userId: user.id, email: user.email, name: user.name, role: user.role,
    });
    const refreshToken = await generateRefreshToken(user.id);

    // Busca equipes do usuário para o seletor de workspace (/workspace)
    const teams = await prisma.teamMember.findMany({
      where: { userId: user.id },
      include: {
        team: {
          select: {
            id: true, name: true, slug: true, ownerId: true,
            owner: { select: { plan: true } },
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    const { password: _, ...userPub } = user;
    return { user: userPub, accessToken, refreshToken, teams };
  }

  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw ApiError.conflict('Este email já está cadastrado');

    let role: 'admin' | 'seller' = 'seller';
    let inviteId: number | undefined;
    let invite: { id: number; teamId: number; role: 'admin' | 'moderator' | 'seller' } | null = null;

    if (input.inviteToken) {
      const found = await prisma.invite.findUnique({ where: { token: input.inviteToken } });
      if (!found || found.status !== 'pending' || new Date() > found.expiresAt) {
        throw ApiError.badRequest('Convite inválido ou expirado');
      }

      // Revalida o limite de membros no momento do ACEITE (concorrência —
      // dois convites podem ser aceitos quase simultaneamente).
      const team = await prisma.team.findUnique({
        where: { id: found.teamId },
        include: { owner: { select: { plan: true } } },
      });
      if (!team) throw ApiError.notFound('Equipe do convite não encontrada');
      await teamService.assertMemberLimitNotReached(found.teamId, team.owner.plan);

      invite = { id: found.id, teamId: found.teamId, role: found.role };
      inviteId = found.id;
    }

    const hashedPassword = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, password: hashedPassword, role },
    });

    if (inviteId && invite) {
      await prisma.invite.update({
        where: { id: inviteId },
        data: { status: 'used', usedBy: user.id, usedAt: new Date() },
      });

      // Adiciona o novo usuário como membro da equipe do convite.
      // role só pode ser 'moderator' ou 'seller' — garantido pelo createInviteSchema.
      await prisma.teamMember.create({
        data: { teamId: invite.teamId, userId: user.id, role: invite.role },
      });
    }

    const accessToken  = generateAccessToken({
      userId: user.id, email: user.email, name: user.name, role: user.role,
    });
    const refreshToken = await generateRefreshToken(user.id);

    // Busca equipes do usuário (vazio se não veio de convite)
    const teams = await prisma.teamMember.findMany({
      where: { userId: user.id },
      include: {
        team: {
          select: {
            id: true, name: true, slug: true, ownerId: true,
            owner: { select: { plan: true } },
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    const { password: _, ...userPub } = user;
    return { user: userPub, accessToken, refreshToken, teams };
  }

  async refreshToken(token: string) {
    return rotateRefreshToken(token);
  }

  async logout(userId: number) {
    await revokeAllRefreshTokens(userId);
  }

  async getProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, phone: true, avatar: true,
        role: true, plan: true, salesGoal: true, birthDate: true, isActive: true,
        lastSignedIn: true, createdAt: true, updatedAt: true,
      },
    });
    if (!user) throw ApiError.notFound('Usuário não encontrado');
    return user;
  }

  async updateProfile(userId: number, data: Record<string, any>) {
    const allowed: (keyof typeof data)[] = ['name', 'phone', 'salesGoal'];
    const safe: Record<string, any> = {};
    for (const key of allowed) {
      if (data[key] !== undefined) safe[key] = data[key];
    }
    if (data.avatar !== undefined) {
      const url = String(data.avatar);
      if (!/^https:\/\/.+/.test(url)) throw new Error('Avatar deve ser uma URL HTTPS válida');
      safe.avatar = url;
    }
    return prisma.user.update({
      where: { id: userId },
      data: safe,
      select: {
        id: true, email: true, name: true, phone: true, avatar: true,
        role: true, plan: true, salesGoal: true, lastSignedIn: true, createdAt: true, updatedAt: true,
      },
    });
  }
}

export const authService = new AuthService();
