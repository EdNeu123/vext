import { Response, NextFunction } from 'express';
import { teamService } from '../services/team.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { apiResponse } from '../utils/helpers';

export class TeamController {
  async list(_req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await teamService.listMembers())); } catch (e) { next(e); }
  }

  async getSellers(_req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await teamService.getSellers())); } catch (e) { next(e); }
  }

  async getSellerRanking(_req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await teamService.getSellerRanking())); } catch (e) { next(e); }
  }

  async updateMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await teamService.updateMember(Number(req.params.id), req.body, req.user!.id, req.user!.name);
      res.json(apiResponse(null, 'Membro atualizado'));
    } catch (e) { next(e); }
  }
}

export const teamController = new TeamController();
