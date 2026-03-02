import { Response, NextFunction } from 'express';
import { teamService } from '../services/team.service';
import { inviteService } from '../services/invite.service';
import { notificationService } from '../services/notification.service';
import { dashboardService } from '../services/dashboard.service';
import { landingPageService } from '../services/landing-page.service';
import { contactService } from '../services/contact.service';
import { auditService } from '../services/audit.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { apiResponse } from '../utils/helpers';

// ==========================================
// TEAM CONTROLLER
// ==========================================

export class TeamController {
  async list(_req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await teamService.listMembers())); } catch (e) { next(e); }
  }
  async getSellers(_req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await teamService.getSellers())); } catch (e) { next(e); }
  }
  async getSellerRanking(_req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await teamService.getSellerRanking())); } catch (e) { next(e); }
  }
  async updateMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await teamService.updateMember(Number(req.params.id), req.body, req.user!.id, req.user!.name);
      res.json(apiResponse(null, 'Membro atualizado'));
    } catch (e) { next(e); }
  }
}
export const teamController = new TeamController();

// ==========================================
// INVITE CONTROLLER
// ==========================================

export class InviteController {
  async list(_req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await inviteService.list())); } catch (e) { next(e); }
  }
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.status(201).json(apiResponse(await inviteService.create(req.body, req.user!.id, req.user!.name), 'Convite criado'));
    } catch (e) { next(e); }
  }
  async validate(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await inviteService.validate(req.params.token))); } catch (e) { next(e); }
  }
  async revoke(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await inviteService.revoke(Number(req.params.id), req.user!.id, req.user!.name);
      res.json(apiResponse(null, 'Convite revogado'));
    } catch (e) { next(e); }
  }
}
export const inviteController = new InviteController();

// ==========================================
// NOTIFICATION CONTROLLER
// ==========================================

export class NotificationController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await notificationService.list(req.user!.id))); } catch (e) { next(e); }
  }
  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.markAsRead(Number(req.params.id));
      res.json(apiResponse(null, 'Notificação lida'));
    } catch (e) { next(e); }
  }
  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllAsRead(req.user!.id);
      res.json(apiResponse(null, 'Todas marcadas como lidas'));
    } catch (e) { next(e); }
  }
  async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse({ count: await notificationService.getUnreadCount(req.user!.id) })); } catch (e) { next(e); }
  }
}
export const notificationController = new NotificationController();

// ==========================================
// DASHBOARD CONTROLLER
// ==========================================

export class DashboardController {
  async getMetrics(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await dashboardService.getMetrics(req.user!.id, req.user!.role))); } catch (e) { next(e); }
  }
  async getGoalProgress(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await dashboardService.getGoalProgress(req.user!.id))); } catch (e) { next(e); }
  }
  async getTodayTasks(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await dashboardService.getTodayTasks(req.user!.id, req.user!.role))); } catch (e) { next(e); }
  }
}
export const dashboardController = new DashboardController();

// ==========================================
// LANDING PAGE CONTROLLER
// ==========================================

export class LandingPageController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await landingPageService.list(req.user!.id, req.user!.role))); } catch (e) { next(e); }
  }
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await landingPageService.getById(Number(req.params.id)))); } catch (e) { next(e); }
  }
  async getBySlug(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await landingPageService.getBySlug(req.params.slug))); } catch (e) { next(e); }
  }
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.status(201).json(apiResponse(await landingPageService.create(req.body, req.user!.id, req.user!.name), 'Landing Page criada'));
    } catch (e) { next(e); }
  }
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(apiResponse(await landingPageService.update(Number(req.params.id), req.body, req.user!.id, req.user!.name), 'Landing Page atualizada'));
    } catch (e) { next(e); }
  }
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await landingPageService.delete(Number(req.params.id), req.user!.id, req.user!.name);
      res.json(apiResponse(null, 'Landing Page deletada'));
    } catch (e) { next(e); }
  }
  async recordConversion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await landingPageService.recordConversion(req.params.slug);
      res.json(apiResponse(null, 'Conversão registrada'));
    } catch (e) { next(e); }
  }
}
export const landingPageController = new LandingPageController();

// ==========================================
// AI CONTROLLER
// ==========================================

export class AiController {
  async getVextRadar(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [churnAlerts, repurchaseOpportunities] = await Promise.all([
        contactService.getHighChurnRisk(),
        contactService.getRepurchaseOpportunities(),
      ]);
      res.json(apiResponse({ churnAlerts, repurchaseOpportunities }));
    } catch (e) { next(e); }
  }
}
export const aiController = new AiController();

// ==========================================
// AUDIT CONTROLLER
// ==========================================

export class AuditController {
  async getByEntity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(apiResponse(await auditService.getByEntity(req.params.entityType as any, Number(req.params.entityId))));
    } catch (e) { next(e); }
  }
  async getRecent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(apiResponse(await auditService.getRecent(Number(req.query.limit) || 100)));
    } catch (e) { next(e); }
  }
}
export const auditController = new AuditController();
