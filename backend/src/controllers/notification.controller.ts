import { Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { apiResponse } from '../utils/helpers';

export class NotificationController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await notificationService.list(req.user!.id))); } catch (e) { next(e); }
  }

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.markAsRead(Number(req.params.id));
      res.json(apiResponse(null, 'Notificação lida'));
    } catch (e) { next(e); }
  }

  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllAsRead(req.user!.id);
      res.json(apiResponse(null, 'Todas marcadas como lidas'));
    } catch (e) { next(e); }
  }

  async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse({ count: await notificationService.getUnreadCount(req.user!.id) })); } catch (e) { next(e); }
  }
}

export const notificationController = new NotificationController();
