import { Router } from 'express';
import { authenticate, authorizeAdmin, validate } from '../middlewares';
import { authController } from '../controllers/auth.controller';
import { contactController } from '../controllers/contact.controller';
import { dealController } from '../controllers/deal.controller';
import { tagController } from '../controllers/tag.controller';
import { productController } from '../controllers/product.controller';
import { taskController } from '../controllers/task.controller';
import {
  teamController, inviteController, notificationController,
  dashboardController, landingPageController, aiController, auditController,
} from '../controllers/app.controller';
import {
  loginSchema, registerSchema, updateProfileSchema,
  createContactSchema, updateContactSchema, bulkImportContactsSchema,
  createDealSchema, updateDealSchema,
  createTagSchema, updateTagSchema,
  createProductSchema, updateProductSchema,
  createTaskSchema, updateTaskSchema,
  createLandingPageSchema, updateLandingPageSchema,
  createInviteSchema, updateMemberSchema,
} from '../models/schemas';

const router = Router();

// ==========================================
// AUTH
// ==========================================
router.post('/auth/login', validate(loginSchema), (req, res, next) => authController.login(req, res, next));
router.post('/auth/register', validate(registerSchema), (req, res, next) => authController.register(req, res, next));
router.post('/auth/refresh', (req, res, next) => authController.refreshToken(req, res, next));
router.post('/auth/logout', authenticate, (req, res, next) => authController.logout(req as any, res, next));
router.get('/auth/me', authenticate, (req, res, next) => authController.getProfile(req as any, res, next));
router.put('/auth/profile', authenticate, validate(updateProfileSchema), (req, res, next) => authController.updateProfile(req as any, res, next));

// ==========================================
// CONTACTS
// ==========================================
router.get('/contacts', authenticate, (req, res, next) => contactController.list(req as any, res, next));
router.get('/contacts/churn-risk', authenticate, (req, res, next) => contactController.getHighChurnRisk(req as any, res, next));
router.get('/contacts/repurchase', authenticate, (req, res, next) => contactController.getRepurchaseOpportunities(req as any, res, next));
router.get('/contacts/:id', authenticate, (req, res, next) => contactController.getById(req as any, res, next));
router.post('/contacts', authenticate, validate(createContactSchema), (req, res, next) => contactController.create(req as any, res, next));
router.post('/contacts/bulk', authenticate, validate(bulkImportContactsSchema), (req, res, next) => contactController.bulkImport(req as any, res, next));
router.put('/contacts/:id', authenticate, validate(updateContactSchema), (req, res, next) => contactController.update(req as any, res, next));
router.delete('/contacts/:id', authenticate, (req, res, next) => contactController.delete(req as any, res, next));

// ==========================================
// DEALS
// ==========================================
router.get('/deals', authenticate, (req, res, next) => dealController.list(req as any, res, next));
router.get('/deals/stats', authenticate, (req, res, next) => dealController.getStats(req as any, res, next));
router.get('/deals/:id', authenticate, (req, res, next) => dealController.getById(req as any, res, next));
router.post('/deals', authenticate, validate(createDealSchema), (req, res, next) => dealController.create(req as any, res, next));
router.put('/deals/:id', authenticate, validate(updateDealSchema), (req, res, next) => dealController.update(req as any, res, next));
router.delete('/deals/:id', authenticate, (req, res, next) => dealController.delete(req as any, res, next));

// ==========================================
// TAGS
// ==========================================
router.get('/tags', authenticate, (req, res, next) => tagController.list(req as any, res, next));
router.post('/tags', authenticate, validate(createTagSchema), (req, res, next) => tagController.create(req as any, res, next));
router.put('/tags/:id', authenticate, validate(updateTagSchema), (req, res, next) => tagController.update(req as any, res, next));
router.delete('/tags/:id', authenticate, (req, res, next) => tagController.delete(req as any, res, next));

// ==========================================
// PRODUCTS
// ==========================================
router.get('/products', authenticate, (req, res, next) => productController.list(req as any, res, next));
router.get('/products/:id', authenticate, (req, res, next) => productController.getById(req as any, res, next));
router.post('/products', authenticate, authorizeAdmin, validate(createProductSchema), (req, res, next) => productController.create(req as any, res, next));
router.put('/products/:id', authenticate, authorizeAdmin, validate(updateProductSchema), (req, res, next) => productController.update(req as any, res, next));
router.delete('/products/:id', authenticate, authorizeAdmin, (req, res, next) => productController.delete(req as any, res, next));

// ==========================================
// TASKS
// ==========================================
router.get('/tasks', authenticate, (req, res, next) => taskController.list(req as any, res, next));
router.get('/tasks/pending-count', authenticate, (req, res, next) => taskController.getPendingCount(req as any, res, next));
router.get('/tasks/by-date', authenticate, (req, res, next) => taskController.getByDate(req as any, res, next));
router.get('/tasks/by-month', authenticate, (req, res, next) => taskController.getByMonth(req as any, res, next));
router.get('/tasks/:id', authenticate, (req, res, next) => taskController.getById(req as any, res, next));
router.post('/tasks', authenticate, validate(createTaskSchema), (req, res, next) => taskController.create(req as any, res, next));
router.put('/tasks/:id', authenticate, validate(updateTaskSchema), (req, res, next) => taskController.update(req as any, res, next));
router.delete('/tasks/:id', authenticate, (req, res, next) => taskController.delete(req as any, res, next));

// ==========================================
// TEAM
// ==========================================
router.get('/team', authenticate, (req, res, next) => teamController.list(req as any, res, next));
router.get('/team/sellers', authenticate, (req, res, next) => teamController.getSellers(req as any, res, next));
router.get('/team/ranking', authenticate, (req, res, next) => teamController.getSellerRanking(req as any, res, next));
router.put('/team/:id', authenticate, authorizeAdmin, validate(updateMemberSchema), (req, res, next) => teamController.updateMember(req as any, res, next));

// ==========================================
// INVITES
// ==========================================
router.get('/invites', authenticate, authorizeAdmin, (req, res, next) => inviteController.list(req as any, res, next));
router.post('/invites', authenticate, authorizeAdmin, validate(createInviteSchema), (req, res, next) => inviteController.create(req as any, res, next));
router.get('/invites/validate/:token', (req, res, next) => inviteController.validate(req as any, res, next));
router.put('/invites/:id/revoke', authenticate, authorizeAdmin, (req, res, next) => inviteController.revoke(req as any, res, next));

// ==========================================
// NOTIFICATIONS
// ==========================================
router.get('/notifications', authenticate, (req, res, next) => notificationController.list(req as any, res, next));
router.get('/notifications/unread-count', authenticate, (req, res, next) => notificationController.getUnreadCount(req as any, res, next));
router.put('/notifications/:id/read', authenticate, (req, res, next) => notificationController.markAsRead(req as any, res, next));
router.put('/notifications/read-all', authenticate, (req, res, next) => notificationController.markAllAsRead(req as any, res, next));

// ==========================================
// DASHBOARD
// ==========================================
router.get('/dashboard/metrics', authenticate, (req, res, next) => dashboardController.getMetrics(req as any, res, next));
router.get('/dashboard/goal-progress', authenticate, (req, res, next) => dashboardController.getGoalProgress(req as any, res, next));
router.get('/dashboard/today-tasks', authenticate, (req, res, next) => dashboardController.getTodayTasks(req as any, res, next));

// ==========================================
// LANDING PAGES
// ==========================================
router.get('/landing-pages', authenticate, (req, res, next) => landingPageController.list(req as any, res, next));
router.get('/landing-pages/slug/:slug', (req, res, next) => landingPageController.getBySlug(req as any, res, next));
router.get('/landing-pages/:id', authenticate, (req, res, next) => landingPageController.getById(req as any, res, next));
router.post('/landing-pages', authenticate, validate(createLandingPageSchema), (req, res, next) => landingPageController.create(req as any, res, next));
router.put('/landing-pages/:id', authenticate, validate(updateLandingPageSchema), (req, res, next) => landingPageController.update(req as any, res, next));
router.delete('/landing-pages/:id', authenticate, (req, res, next) => landingPageController.delete(req as any, res, next));
router.post('/landing-pages/slug/:slug/conversion', (req, res, next) => landingPageController.recordConversion(req as any, res, next));

// ==========================================
// AI
// ==========================================
router.get('/ai/vext-radar', authenticate, (req, res, next) => aiController.getVextRadar(req as any, res, next));

// ==========================================
// AUDIT
// ==========================================
router.get('/audit/:entityType/:entityId', authenticate, (req, res, next) => auditController.getByEntity(req as any, res, next));
router.get('/audit/recent', authenticate, authorizeAdmin, (req, res, next) => auditController.getRecent(req as any, res, next));

export default router;
