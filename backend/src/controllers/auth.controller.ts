import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { apiResponse } from '../utils/helpers';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.json(apiResponse(result, 'Login realizado'));
    } catch (e) { next(e); }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(apiResponse(result, 'Registro realizado'));
    } catch (e) { next(e); }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'Refresh token obrigatório' });
      }
      const result = await authService.refreshToken(refreshToken);
      res.json(apiResponse(result, 'Token renovado'));
    } catch (e) { next(e); }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.logout(req.user!.id);
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
