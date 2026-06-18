import { Router } from 'express';
import { authenticate, requireTeamAccess } from '../middlewares';
import { aiController } from '../controllers/ai.controller';

const router = Router();

router.get('/vext-radar', authenticate, requireTeamAccess, (req, res, next) => aiController.getVextRadar(req as any, res, next));

export default router;
