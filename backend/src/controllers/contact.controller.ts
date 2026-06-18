import { Response, NextFunction } from 'express';
import { contactService } from '../services/contact.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { apiResponse, paginatedResponse, extractPagination } from '../utils/helpers';

export class ContactController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string | undefined;
      const { page, limit } = extractPagination(req.query as any);
      const { data, total } = await contactService.list(req.teamId!, search, page, limit);
      res.json(paginatedResponse(data, total, page, limit));
    } catch (e) { next(e); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(apiResponse(await contactService.getById(Number(req.params.id), req.teamId!)));
    } catch (e) { next(e); }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const contact = await contactService.create(req.body, req.user!.id, req.teamId!);
      res.status(201).json(apiResponse(contact, 'Contato criado'));
    } catch (e) { next(e); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const contact = await contactService.update(Number(req.params.id), req.body, req.teamId!);
      res.json(apiResponse(contact, 'Contato atualizado'));
    } catch (e) { next(e); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await contactService.delete(Number(req.params.id), req.teamId!);
      res.json(apiResponse(null, 'Contato deletado'));
    } catch (e) { next(e); }
  }

  async bulkImport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await contactService.bulkImport(req.body, req.user!.id, req.teamId!);
      res.status(201).json(apiResponse(result));
    } catch (e) { next(e); }
  }

  async getHighChurnRisk(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(apiResponse(await contactService.getHighChurnRisk(req.teamId!)));
    } catch (e) { next(e); }
  }

  async getRepurchaseOpportunities(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(apiResponse(await contactService.getRepurchaseOpportunities(req.teamId!)));
    } catch (e) { next(e); }
  }
}

export const contactController = new ContactController();
