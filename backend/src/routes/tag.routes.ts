import { Router } from 'express';
import { authenticate, validate, requireTeamAccess, requireTeamStaff } from '../middlewares';
import { tagController } from '../controllers/tag.controller';
import { createTagSchema, updateTagSchema } from '../models/schemas';

const router = Router();

router.get('/',           authenticate, requireTeamAccess,                                    (req, res, next) => tagController.list(req as any, res, next));
router.get('/:id/usage',  authenticate, requireTeamAccess,                                    (req, res, next) => tagController.getUsage(req as any, res, next));
router.post('/',          authenticate, requireTeamAccess, requireTeamStaff, validate(createTagSchema), (req, res, next) => tagController.create(req as any, res, next));
router.put('/:id',        authenticate, requireTeamAccess, requireTeamStaff, validate(updateTagSchema), (req, res, next) => tagController.update(req as any, res, next));
router.delete('/:id',     authenticate, requireTeamAccess, requireTeamStaff,                  (req, res, next) => tagController.delete(req as any, res, next));

export default router;
