import { Response, NextFunction } from 'express';
import { contactService } from '../services/contact.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { apiResponse } from '../utils/helpers';

export class AiController {
  async getVextRadar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [churnAlerts, repurchaseOpportunities] = await Promise.all([
        contactService.getHighChurnRisk(req.teamId!),
        contactService.getRepurchaseOpportunities(req.teamId!),
      ]);
      res.json(apiResponse({ churnAlerts, repurchaseOpportunities }));
    } catch (e) { next(e); }
  }
}

export const aiController = new AiController();
