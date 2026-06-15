import { Router } from 'express';
import { authenticate, requireTeamAccess, requireTeamAdmin } from '../middlewares';
import { auditController } from '../controllers/audit.controller';

const router = Router();

router.get('/:entityType/:entityId', authenticate, requireTeamAccess,                     (req, res, next) => auditController.getByEntity(req as any, res, next));
router.get('/recent',                authenticate, requireTeamAccess, requireTeamAdmin,    (req, res, next) => auditController.getRecent(req as any, res, next));

export default router;
