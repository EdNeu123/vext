import { Router } from 'express';
import { authenticate, requireTeamAccess } from '../middlewares';
import { dashboardController } from '../controllers/dashboard.controller';

const router = Router();

router.get('/metrics',       authenticate, requireTeamAccess, (req, res, next) => dashboardController.getMetrics(req as any, res, next));
router.get('/goal-progress', authenticate, requireTeamAccess, (req, res, next) => dashboardController.getGoalProgress(req as any, res, next));
router.get('/today-tasks',   authenticate, requireTeamAccess, (req, res, next) => dashboardController.getTodayTasks(req as any, res, next));
router.get('/timeseries',    authenticate, requireTeamAccess, (req, res, next) => dashboardController.getTimeseries(req as any, res, next));
router.get('/monthly',       authenticate, requireTeamAccess, (req, res, next) => dashboardController.getMonthly(req as any, res, next));

export default router;
