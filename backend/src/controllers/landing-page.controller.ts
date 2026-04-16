import { Response, NextFunction } from 'express';
import { landingPageService } from '../services/landing-page.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { apiResponse } from '../utils/helpers';

export class LandingPageController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await landingPageService.list(req.user!.id, req.user!.role))); } catch (e) { next(e); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await landingPageService.getById(Number(req.params.id)))); } catch (e) { next(e); }
  }

  async getBySlug(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await landingPageService.getBySlug(req.params.slug as string))); } catch (e) { next(e); }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.status(201).json(apiResponse(await landingPageService.create(req.body, req.user!.id, req.user!.name), 'Landing Page criada'));
    } catch (e) { next(e); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(apiResponse(await landingPageService.update(Number(req.params.id), req.body, req.user!.id, req.user!.name), 'Landing Page atualizada'));
    } catch (e) { next(e); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await landingPageService.delete(Number(req.params.id), req.user!.id, req.user!.name);
      res.json(apiResponse(null, 'Landing Page deletada'));
    } catch (e) { next(e); }
  }

  async recordConversion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await landingPageService.recordConversion(req.params.slug as string);
      res.json(apiResponse(null, 'Conversão registrada'));
    } catch (e) { next(e); }
  }
}

export const landingPageController = new LandingPageController();
