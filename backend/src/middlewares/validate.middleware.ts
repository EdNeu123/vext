import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sanitizeObject } from '../utils/sanitize';

/**
 * Middleware: Valida body com Zod + Sanitiza contra XSS
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Sanitiza o body contra XSS antes de validar
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
      }

      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        next({
          statusCode: 400,
          message: messages.join('; '),
          isOperational: true,
        } as any);
      } else {
        next(error);
      }
    }
  };
}
