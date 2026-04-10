import { Router } from 'express';
import { authenticate, authorizeAdmin, validate } from '../middlewares';
import { productController } from '../controllers/product.controller';
import { createProductSchema, updateProductSchema } from '../models/schemas';

const router = Router();

router.get('/',       authenticate,                                           (req, res, next) => productController.list(req as any, res, next));
router.get('/:id',    authenticate,                                           (req, res, next) => productController.getById(req as any, res, next));
router.post('/',      authenticate, authorizeAdmin, validate(createProductSchema), (req, res, next) => productController.create(req as any, res, next));
router.put('/:id',    authenticate, authorizeAdmin, validate(updateProductSchema), (req, res, next) => productController.update(req as any, res, next));
router.delete('/:id', authenticate, authorizeAdmin,                           (req, res, next) => productController.delete(req as any, res, next));

export default router;
