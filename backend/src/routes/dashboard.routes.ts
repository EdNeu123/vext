import { Router } from 'express';
import { authenticate } from '../middlewares';
import { dashboardController } from '../controllers/dashboard.controller';

const router = Router();

router.get('/metrics',      authenticate, (req, res, next) => dashboardController.getMetrics(req as any, res, next));
router.get('/goal-progress', authenticate, (req, res, next) => dashboardController.getGoalProgress(req as any, res, next));
router.get('/today-tasks',  authenticate, (req, res, next) => dashboardController.getTodayTasks(req as any, res, next));

export default router;
