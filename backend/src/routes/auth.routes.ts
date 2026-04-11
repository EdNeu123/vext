import { Router } from 'express';
import { authenticate, validate } from '../middlewares';
import { authController } from '../controllers/auth.controller';
import { loginSchema, registerSchema, updateProfileSchema } from '../models/schemas';

const router = Router();

router.post('/login',   validate(loginSchema),         (req, res, next) => authController.login(req, res, next));
router.post('/register', validate(registerSchema),     (req, res, next) => authController.register(req, res, next));
router.post('/refresh',                                (req, res, next) => authController.refreshToken(req, res, next));
router.post('/logout',  authenticate,                  (req, res, next) => authController.logout(req as any, res, next));
router.get('/me',       authenticate,                  (req, res, next) => authController.getProfile(req as any, res, next));
router.put('/profile',  authenticate, validate(updateProfileSchema), (req, res, next) => authController.updateProfile(req as any, res, next));

export default router;
