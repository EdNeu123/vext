import { Router } from 'express';
import { authenticate, authorizeAdmin, validate } from '../middlewares';
import { teamController } from '../controllers/team.controller';
import { updateMemberSchema } from '../models/schemas';

const router = Router();

router.get('/',         authenticate,                                          (req, res, next) => teamController.list(req as any, res, next));
router.get('/sellers',  authenticate,                                          (req, res, next) => teamController.getSellers(req as any, res, next));
router.get('/ranking',  authenticate,                                          (req, res, next) => teamController.getSellerRanking(req as any, res, next));
router.put('/:id',      authenticate, authorizeAdmin, validate(updateMemberSchema), (req, res, next) => teamController.updateMember(req as any, res, next));

export default router;
