import { Response, NextFunction } from 'express';
import { dealService } from '../services/deal.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { apiResponse, paginatedResponse, extractPagination } from '../utils/helpers';

export class DealController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = extractPagination(req.query as any);
      const { data, total } = await dealService.list(req.user!.id, req.user!.role, page, limit);
      res.json(paginatedResponse(data, total, page, limit));
    } catch (e) { next(e); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(apiResponse(await dealService.getById(Number(req.params.id))));
    } catch (e) { next(e); }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const deal = await dealService.create(req.body, req.user!.id, req.user!.name);
      res.status(201).json(apiResponse(deal, 'Oportunidade criada'));
    } catch (e) { next(e); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const deal = await dealService.update(Number(req.params.id), req.body, req.user!.id, req.user!.name);
      res.json(apiResponse(deal, 'Oportunidade atualizada'));
    } catch (e) { next(e); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await dealService.delete(Number(req.params.id), req.user!.id, req.user!.name);
      res.json(apiResponse(null, 'Oportunidade deletada'));
    } catch (e) { next(e); }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(apiResponse(await dealService.getStats(req.user!.id, req.user!.role)));
    } catch (e) { next(e); }
  }
}

export const dealController = new DealController();
