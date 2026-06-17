import { Response, NextFunction } from 'express';
import { inviteService } from '../services/invite.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { apiResponse } from '../utils/helpers';

export class InviteController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await inviteService.list(req.teamId!))); } catch (e) { next(e); }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.status(201).json(apiResponse(await inviteService.create(req.body, req.user!.id, req.user!.name, req.teamId!), 'Convite criado'));
    } catch (e) { next(e); }
  }

  async validate(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await inviteService.validate(req.params.token as string))); } catch (e) { next(e); }
  }

  async revoke(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await inviteService.revoke(Number(req.params.id), req.teamId!, req.user!.id, req.user!.name);
      res.json(apiResponse(null, 'Convite revogado'));
    } catch (e) { next(e); }
  }
}

export const inviteController = new InviteController();
