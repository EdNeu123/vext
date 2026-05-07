import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { apiResponse } from '../utils/helpers';
import { env } from '../config/env';

const REFRESH_COOKIE = 'vext_refresh';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
      const { refreshToken: _, ...safe } = result;
      res.json(apiResponse(safe, 'Login realizado'));
    } catch (e) { next(e); }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
      const { refreshToken: _, ...safe } = result;
      res.status(201).json(apiResponse(safe, 'Registro realizado'));
    } catch (e) { next(e); }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
      if (!token) {
        return res.status(400).json({ success: false, message: 'Refresh token obrigatório' });
      }
      const result = await authService.refreshToken(token);
      if (!result) {
        return res.status(401).json({ success: false, message: 'Refresh token inválido ou expirado' });
      }
      res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
      res.json(apiResponse({ accessToken: result.accessToken }, 'Token renovado'));
    } catch (e) { next(e); }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.logout(req.user!.id);
      res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: 0 });
      res.json(apiResponse(null, 'Logout realizado'));
    } catch (e) { next(e); }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(apiResponse(await authService.getProfile(req.user!.id)));
    } catch (e) { next(e); }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.updateProfile(req.user!.id, req.body);
      res.json(apiResponse(user, 'Perfil atualizado'));
    } catch (e) { next(e); }
  }
}

export const authController = new AuthController();
