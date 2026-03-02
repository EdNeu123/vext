import { Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { apiResponse } from '../utils/helpers';

export class ProductController {
  async list(_req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await productService.list())); } catch (e) { next(e); }
  }
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(apiResponse(await productService.getById(Number(req.params.id)))); } catch (e) { next(e); }
  }
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.status(201).json(apiResponse(await productService.create(req.body), 'Produto criado'));
    } catch (e) { next(e); }
  }
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(apiResponse(await productService.update(Number(req.params.id), req.body), 'Produto atualizado'));
    } catch (e) { next(e); }
  }
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await productService.delete(Number(req.params.id));
      res.json(apiResponse(null, 'Produto desativado'));
    } catch (e) { next(e); }
  }
}

export const productController = new ProductController();
