import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import {
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
  revokeAllRefreshTokens,
} from '../utils/jwt';
import { ApiError } from '../utils/helpers';
import type { LoginInput, RegisterInput } from '../models/schemas';

export class AuthService {
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Credenciais inválidas');
    }

    const isValidPassword = await bcrypt.compare(input.password, user.password);
    if (!isValidPassword) {
      throw ApiError.unauthorized('Credenciais inválidas');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastSignedIn: new Date() },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const refreshToken = await generateRefreshToken(user.id);

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw ApiError.conflict('Este email já está cadastrado');

    let role: 'admin' | 'seller' = 'seller';
    let inviteId: number | undefined;

    if (input.inviteToken) {
      const invite = await prisma.invite.findUnique({ where: { token: input.inviteToken } });

      if (!invite || invite.status !== 'pending' || new Date() > invite.expiresAt) {
        throw ApiError.badRequest('Convite inválido ou expirado');
      }

      role = invite.role;
      inviteId = invite.id;
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, password: hashedPassword, role },
    });

    if (inviteId) {
      await prisma.invite.update({
        where: { id: inviteId },
        data: { status: 'used', usedBy: user.id, usedAt: new Date() },
      });
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const refreshToken = await generateRefreshToken(user.id);

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  async refreshToken(token: string) {
    const result = await rotateRefreshToken(token);
    if (!result) {
      throw ApiError.unauthorized('Refresh token inválido ou expirado');
    }
    return result;
  }

  async logout(userId: number) {
    await revokeAllRefreshTokens(userId);
  }

  async getProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, phone: true, avatar: true,
        role: true, salesGoal: true, birthDate: true, isActive: true,
        lastSignedIn: true, createdAt: true, updatedAt: true,
      },
    });
    if (!user) throw ApiError.notFound('Usuário não encontrado');
    return user;
  }

  async updateProfile(userId: number, data: Record<string, any>) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, email: true, name: true, phone: true, avatar: true,
        role: true, salesGoal: true, lastSignedIn: true, createdAt: true, updatedAt: true,
      },
    });
  }
}

export const authService = new AuthService();
