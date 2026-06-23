import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { responderError } from '../utils/response';

export const validar = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const resultado = schema.safeParse(req.body);

    if (!resultado.success) {
      const errores = resultado.error.issues.map((e) => ({
        campo: e.path.join('.'),
        mensaje: e.message
      }));
      responderError(res, 'Datos de entrada inválidos', 400, errores);
      return;
    }

    req.body = resultado.data;
    next();
  };
};