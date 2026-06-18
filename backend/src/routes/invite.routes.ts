import { Router } from 'express';
import { authenticate, validate, requireTeamAccess, requireTeamStaff } from '../middlewares';
import { inviteController } from '../controllers/invite.controller';
import { createInviteSchema } from '../models/schemas';

const router = Router();

router.get('/',            authenticate, requireTeamAccess, requireTeamStaff,                    (req, res, next) => inviteController.list(req as any, res, next));
router.post('/',           authenticate, requireTeamAccess, requireTeamStaff, validate(createInviteSchema), (req, res, next) => inviteController.create(req as any, res, next));
router.get('/validate/:token',                                                                     (req, res, next) => inviteController.validate(req as any, res, next));
router.put('/:id/revoke',  authenticate, requireTeamAccess, requireTeamStaff,                    (req, res, next) => inviteController.revoke(req as any, res, next));

export default router;
