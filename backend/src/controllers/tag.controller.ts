import { Response, NextFunction } from 'express';
import { tagService } from '../services/tag.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { apiResponse } from '../utils/helpers';

export class TagController {
  async list(_req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await tagService.list())); } catch (e) { next(e); }
  }
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.status(201).json(apiResponse(await tagService.create(req.body), 'Tag criada'));
    } catch (e) { next(e); }
  }
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(apiResponse(await tagService.update(Number(req.params.id), req.body), 'Tag atualizada'));
    } catch (e) { next(e); }
  }
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await tagService.delete(Number(req.params.id));
      res.json(apiResponse(null, 'Tag deletada'));
    } catch (e) { next(e); }
  }
}

export const tagController = new TagController();
