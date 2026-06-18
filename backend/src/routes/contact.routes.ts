import { Router } from 'express';
import { authenticate, validate } from '../middlewares';
import { contactController } from '../controllers/contact.controller';
import { createContactSchema, updateContactSchema, bulkImportContactsSchema } from '../models/schemas';

const router = Router();

router.get('/',          authenticate,                              (req, res, next) => contactController.list(req as any, res, next));
router.get('/churn-risk', authenticate,                            (req, res, next) => contactController.getHighChurnRisk(req as any, res, next));
router.get('/repurchase', authenticate,                            (req, res, next) => contactController.getRepurchaseOpportunities(req as any, res, next));
router.get('/:id',       authenticate,                             (req, res, next) => contactController.getById(req as any, res, next));
router.post('/',         authenticate, validate(createContactSchema), (req, res, next) => contactController.create(req as any, res, next));
router.post('/bulk',     authenticate, validate(bulkImportContactsSchema), (req, res, next) => contactController.bulkImport(req as any, res, next));
router.put('/:id',       authenticate, validate(updateContactSchema),  (req, res, next) => contactController.update(req as any, res, next));
router.delete('/:id',    authenticate,                             (req, res, next) => contactController.delete(req as any, res, next));

export default router;
