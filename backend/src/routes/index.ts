import { Router } from 'express';
import authRoutes        from './auth.routes';
import contactRoutes     from './contact.routes';
import cardRoutes        from './card.routes';
import tagRoutes         from './tag.routes';
import productRoutes     from './product.routes';
import taskRoutes        from './task.routes';
import teamRoutes        from './team.routes';
import inviteRoutes      from './invite.routes';
import notificationRoutes from './notification.routes';
import dashboardRoutes   from './dashboard.routes';
import landingPageRoutes from './landing-page.routes';
import aiRoutes          from './ai.routes';
import auditRoutes       from './audit.routes';

const router = Router();

router.use('/auth',           authRoutes);
router.use('/contacts',       contactRoutes);
router.use('/cards',          cardRoutes);
router.use('/tags',           tagRoutes);
router.use('/products',       productRoutes);
router.use('/tasks',          taskRoutes);
router.use('/team',           teamRoutes);
router.use('/invites',        inviteRoutes);
router.use('/notifications',  notificationRoutes);
router.use('/dashboard',      dashboardRoutes);
router.use('/landing-pages',  landingPageRoutes);
router.use('/ai',             aiRoutes);
router.use('/audit',          auditRoutes);

export default router;
