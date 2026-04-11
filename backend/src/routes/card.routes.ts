import { Router } from 'express';
import { authenticate, validate } from '../middlewares';
import { cardController } from '../controllers/card.controller';
import { createCardSchema, updateCardSchema } from '../models/schemas';

const router = Router();

router.get('/',        authenticate,                          (req, res, next) => cardController.list(req as any, res, next));
router.get('/stats',   authenticate,                          (req, res, next) => cardController.getStats(req as any, res, next));
router.get('/:id',     authenticate,                          (req, res, next) => cardController.getById(req as any, res, next));
router.post('/',       authenticate, validate(createCardSchema), (req, res, next) => cardController.create(req as any, res, next));
router.put('/:id',     authenticate, validate(updateCardSchema), (req, res, next) => cardController.update(req as any, res, next));
router.delete('/:id',  authenticate,                          (req, res, next) => cardController.delete(req as any, res, next));

export default router;
