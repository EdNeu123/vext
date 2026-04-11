import { Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { apiResponse } from '../utils/helpers';

export class DashboardController {
  async getMetrics(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await dashboardService.getMetrics(req.user!.id, req.user!.role))); } catch (e) { next(e); }
  }

  async getGoalProgress(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await dashboardService.getGoalProgress(req.user!.id))); } catch (e) { next(e); }
  }

  async getTodayTasks(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await dashboardService.getTodayTasks(req.user!.id, req.user!.role))); } catch (e) { next(e); }
  }
}

export const dashboardController = new DashboardController();
