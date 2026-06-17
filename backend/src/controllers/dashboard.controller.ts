import { Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { apiResponse } from '../utils/helpers';

type Metric = 'pipeline' | 'won' | 'conversion' | 'avgTicket';
type Period = '7d' | '30d' | '12m';

export class DashboardController {
  async getMetrics(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await dashboardService.getMetrics(req.teamId!))); } catch (e) { next(e); }
  }

  async getGoalProgress(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await dashboardService.getGoalProgress(req.user!.id, req.teamId!))); } catch (e) { next(e); }
  }

  async getTodayTasks(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await dashboardService.getTodayTasks(req.teamId!))); } catch (e) { next(e); }
  }

  async getTimeseries(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const metric = (req.query.metric as Metric) || 'pipeline';
      const period = (req.query.period as Period) || '30d';
      if (!['pipeline', 'won', 'conversion', 'avgTicket'].includes(metric)) {
        return res.status(400).json(apiResponse(null, 'metric inválido'));
      }
      if (!['7d', '30d', '12m'].includes(period)) {
        return res.status(400).json(apiResponse(null, 'period inválido'));
      }
      res.json(apiResponse(await dashboardService.getTimeseries(req.teamId!, metric, period)));
    } catch (e) { next(e); }
  }

  async getMonthly(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
      res.json(apiResponse(await dashboardService.getMonthlyMetrics(req.teamId!, month)));
    } catch (e) { next(e); }
  }
}

export const dashboardController = new DashboardController();
