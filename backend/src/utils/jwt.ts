import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import type { AuthPayload } from '../types/express.d';

export function generateAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export async function generateRefreshToken(userId: number): Promise<string> {
  const token = crypto.randomBytes(64).toString('hex');

  const match = env.REFRESH_TOKEN_EXPIRES_IN.match(/^(\d+)([dhms])$/);
  const value = match ? parseInt(match[1]) : 7;
  const unit  = match ? match[2] : 'd';

  const expiresAt = new Date();
  switch (unit) {
    case 'd': expiresAt.setDate(expiresAt.getDate() + value); break;
    case 'h': expiresAt.setHours(expiresAt.getHours() + value); break;
    case 'm': expiresAt.setMinutes(expiresAt.getMinutes() + value); break;
    default:  expiresAt.setDate(expiresAt.getDate() + 7);
  }

  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
  return token;
}

export async function rotateRefreshToken(
  oldToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: oldToken },
    include: { user: true },
  });

  if (!stored || stored.revoked || new Date() > stored.expiresAt || !stored.user.isActive) {
    if (stored?.revoked) {
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId },
        data: { revoked: true },
      });
    }
    return null;
  }

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

  const accessToken  = generateAccessToken({ userId: stored.user.id, email: stored.user.email, name: stored.user.name, role: stored.user.role });
  const refreshToken = await generateRefreshToken(stored.user.id);

  return { accessToken, refreshToken };
}

export async function revokeAllRefreshTokens(userId: number): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
}
