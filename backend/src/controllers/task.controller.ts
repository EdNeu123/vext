import { Response, NextFunction } from 'express';
import { taskService } from '../services/task.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { apiResponse, paginatedResponse, extractPagination } from '../utils/helpers';

export class TaskController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = extractPagination(req.query as any);
      const { data, total } = await taskService.list(req.user!.id, req.user!.role, page, limit);
      res.json(paginatedResponse(data, total, page, limit));
    } catch (e) { next(e); }
  }
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await taskService.getById(Number(req.params.id)))); } catch (e) { next(e); }
  }
  async getByDate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(apiResponse(await taskService.getByDate(new Date(req.query.date as string), req.user!.id, req.user!.role)));
    } catch (e) { next(e); }
  }
  async getByMonth(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(apiResponse(await taskService.getByMonth(Number(req.query.year), Number(req.query.month), req.user!.id, req.user!.role)));
    } catch (e) { next(e); }
  }
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.status(201).json(apiResponse(await taskService.create(req.body, req.user!.id, req.user!.name), 'Tarefa criada'));
    } catch (e) { next(e); }
  }
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(apiResponse(await taskService.update(Number(req.params.id), req.body, req.user!.id, req.user!.name), 'Tarefa atualizada'));
    } catch (e) { next(e); }
  }
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await taskService.delete(Number(req.params.id), req.user!.id, req.user!.name);
      res.json(apiResponse(null, 'Tarefa deletada'));
    } catch (e) { next(e); }
  }
  async getPendingCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(apiResponse({ count: await taskService.getPendingCount(req.user!.id, req.user!.role) }));
    } catch (e) { next(e); }
  }
}

export const taskController = new TaskController();
