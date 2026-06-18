import { Response, NextFunction } from 'express';
import { contactService } from '../services/contact.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { apiResponse } from '../utils/helpers';

export class AiController {
  async getVextRadar(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [churnAlerts, repurchaseOpportunities] = await Promise.all([
        contactService.getHighChurnRisk(),
        contactService.getRepurchaseOpportunities(),
      ]);
      res.json(apiResponse({ churnAlerts, repurchaseOpportunities }));
    } catch (e) { next(e); }
  }
}

export const aiController = new AiController();
