import { Router } from 'express';
import { authenticate, validate } from '../middlewares';
import { tagController } from '../controllers/tag.controller';
import { createTagSchema, updateTagSchema } from '../models/schemas';

const router = Router();

router.get('/',       authenticate,                        (req, res, next) => tagController.list(req as any, res, next));
router.post('/',      authenticate, validate(createTagSchema), (req, res, next) => tagController.create(req as any, res, next));
router.put('/:id',    authenticate, validate(updateTagSchema), (req, res, next) => tagController.update(req as any, res, next));
router.delete('/:id', authenticate,                        (req, res, next) => tagController.delete(req as any, res, next));

export default router;
