import { Response, NextFunction } from 'express';
import { auditService } from '../services/audit.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { apiResponse } from '../utils/helpers';

export class AuditController {
  async getByEntity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(apiResponse(await auditService.getByEntity(req.params.entityType as any, Number(req.params.entityId))));
    } catch (e) { next(e); }
  }

  async getRecent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(apiResponse(await auditService.getRecent(Number(req.query.limit) || 100)));
    } catch (e) { next(e); }
  }
}

export const auditController = new AuditController();
