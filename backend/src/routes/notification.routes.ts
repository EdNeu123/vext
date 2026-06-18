import { Router } from 'express';
import { authenticate } from '../middlewares';
import { notificationController } from '../controllers/notification.controller';

const router = Router();

router.get('/',            authenticate, (req, res, next) => notificationController.list(req as any, res, next));
router.get('/unread-count', authenticate, (req, res, next) => notificationController.getUnreadCount(req as any, res, next));
router.put('/:id/read',    authenticate, (req, res, next) => notificationController.markAsRead(req as any, res, next));
router.put('/read-all',    authenticate, (req, res, next) => notificationController.markAllAsRead(req as any, res, next));

export default router;
