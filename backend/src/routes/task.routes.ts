import { Router } from 'express';
import { authenticate, validate } from '../middlewares';
import { taskController } from '../controllers/task.controller';
import { createTaskSchema, updateTaskSchema } from '../models/schemas';

const router = Router();

router.get('/',              authenticate,                           (req, res, next) => taskController.list(req as any, res, next));
router.get('/pending-count', authenticate,                           (req, res, next) => taskController.getPendingCount(req as any, res, next));
router.get('/by-date',       authenticate,                           (req, res, next) => taskController.getByDate(req as any, res, next));
router.get('/by-month',      authenticate,                           (req, res, next) => taskController.getByMonth(req as any, res, next));
router.get('/:id',           authenticate,                           (req, res, next) => taskController.getById(req as any, res, next));
router.post('/',             authenticate, validate(createTaskSchema), (req, res, next) => taskController.create(req as any, res, next));
router.put('/:id',           authenticate, validate(updateTaskSchema), (req, res, next) => taskController.update(req as any, res, next));
router.delete('/:id',        authenticate,                           (req, res, next) => taskController.delete(req as any, res, next));

export default router;
