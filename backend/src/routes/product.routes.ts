import { Router } from 'express';
import { authenticate, validate, requireTeamAccess, requireTeamStaff } from '../middlewares';
import { productController } from '../controllers/product.controller';
import { createProductSchema, updateProductSchema } from '../models/schemas';

const router = Router();

router.get('/',       authenticate, requireTeamAccess,                                          (req, res, next) => productController.list(req as any, res, next));
router.get('/stats',  authenticate, requireTeamAccess,                                          (req, res, next) => productController.getStats(req as any, res, next));
router.get('/:id',    authenticate, requireTeamAccess,                                          (req, res, next) => productController.getById(req as any, res, next));
router.post('/',      authenticate, requireTeamAccess, requireTeamStaff, validate(createProductSchema), (req, res, next) => productController.create(req as any, res, next));
router.put('/:id',    authenticate, requireTeamAccess, requireTeamStaff, validate(updateProductSchema), (req, res, next) => productController.update(req as any, res, next));
router.delete('/:id', authenticate, requireTeamAccess, requireTeamStaff,                          (req, res, next) => productController.delete(req as any, res, next));

export default router;
