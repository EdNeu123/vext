import { Response, NextFunction } from 'express';
import { tagService } from '../services/tag.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { apiResponse } from '../utils/helpers';

export class TagController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      res.json(apiResponse(await tagService.list(req.teamId!, includeInactive)));
    } catch (e) { next(e); }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.status(201).json(apiResponse(await tagService.create(req.body, req.teamId!), 'Tag criada'));
    } catch (e) { next(e); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(apiResponse(await tagService.update(Number(req.params.id), req.body, req.teamId!), 'Tag atualizada'));
    } catch (e) { next(e); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const force = req.query.force === 'true';
      const result = await tagService.delete(Number(req.params.id), req.teamId!, force);
      const msg = result.hardDeleted ? 'Tag deletada' : 'Tag desativada (histórico preservado)';
      res.json(apiResponse(result, msg));
    } catch (e) { next(e); }
  }

  async getUsage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usage = await tagService.getUsage(Number(req.params.id), req.teamId!);
      if (!usage) return res.status(404).json(apiResponse(null, 'Tag não encontrada'));
      res.json(apiResponse(usage));
    } catch (e) { next(e); }
  }
}

export const tagController = new TagController();
