import { Router } from 'express';
import { authenticate, authorizeAdmin, validate } from '../middlewares';
import { inviteController } from '../controllers/invite.controller';
import { createInviteSchema } from '../models/schemas';

const router = Router();

router.get('/',                   authenticate, authorizeAdmin,                    (req, res, next) => inviteController.list(req as any, res, next));
router.post('/',                  authenticate, authorizeAdmin, validate(createInviteSchema), (req, res, next) => inviteController.create(req as any, res, next));
router.get('/validate/:token',                                                     (req, res, next) => inviteController.validate(req as any, res, next));
router.put('/:id/revoke',         authenticate, authorizeAdmin,                    (req, res, next) => inviteController.revoke(req as any, res, next));

export default router;
