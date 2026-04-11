import { Response, NextFunction } from 'express';
import { cardService } from '../services/card.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { apiResponse, paginatedResponse, extractPagination } from '../utils/helpers';

export class CardController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = extractPagination(req.query as any);
      const { data, total } = await cardService.list(req.user!.id, req.user!.role, page, limit);
      res.json(paginatedResponse(data, total, page, limit));
    } catch (e) { next(e); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(apiResponse(await cardService.getById(Number(req.params.id), req.user!.id, req.user!.role)));
    } catch (e) { next(e); }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const card = await cardService.create(req.body, req.user!.id, req.user!.name);
      res.status(201).json(apiResponse(card, 'Oportunidade criada'));
    } catch (e) { next(e); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const card = await cardService.update(Number(req.params.id), req.body, req.user!.id, req.user!.name, req.user!.role);
      res.json(apiResponse(card, 'Oportunidade atualizada'));
    } catch (e) { next(e); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await cardService.delete(Number(req.params.id), req.user!.id, req.user!.name, req.user!.role);
      res.json(apiResponse(null, 'Oportunidade deletada'));
    } catch (e) { next(e); }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(apiResponse(await cardService.getStats(req.user!.id, req.user!.role)));
    } catch (e) { next(e); }
  }
}

export const cardController = new CardController();
