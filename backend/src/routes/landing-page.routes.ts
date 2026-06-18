import { Router } from 'express';
import { authenticate, validate } from '../middlewares';
import { landingPageController } from '../controllers/landing-page.controller';
import { createLandingPageSchema, updateLandingPageSchema } from '../models/schemas';

const router = Router();

router.get('/',                       authenticate,                               (req, res, next) => landingPageController.list(req as any, res, next));
router.get('/slug/:slug',                                                          (req, res, next) => landingPageController.getBySlug(req as any, res, next));
router.get('/:id',                    authenticate,                               (req, res, next) => landingPageController.getById(req as any, res, next));
router.post('/',                      authenticate, validate(createLandingPageSchema), (req, res, next) => landingPageController.create(req as any, res, next));
router.put('/:id',                    authenticate, validate(updateLandingPageSchema), (req, res, next) => landingPageController.update(req as any, res, next));
router.delete('/:id',                 authenticate,                               (req, res, next) => landingPageController.delete(req as any, res, next));
router.post('/slug/:slug/conversion',                                              (req, res, next) => landingPageController.recordConversion(req as any, res, next));

export default router;
