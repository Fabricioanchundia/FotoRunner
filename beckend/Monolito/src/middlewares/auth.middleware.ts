import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { responderError } from '../utils/response';
import logger from '../utils/logger';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export interface RequestAutenticado extends Request {
  usuario?: TokenPayload;
}

export const verificarToken = (
  req: RequestAutenticado,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      responderError(res, 'Token no proporcionado', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      logger.error('JWT_SECRET no está configurado');
      responderError(res, 'Error de configuración del servidor', 500);
      return;
    }

    const payload = jwt.verify(token, secret) as TokenPayload;
    req.usuario = payload;
    next();
  } catch (error) {
    logger.warn(`Token inválido: ${error}`);
    responderError(res, 'Token inválido o expirado', 401);
  }
};

export const soloAdmin = (
  req: RequestAutenticado,
  res: Response,
  next: NextFunction
): void => {
  if (req.usuario?.role !== 'ADMIN') {
    responderError(res, 'Acceso denegado — se requiere rol ADMIN', 403);
    return;
  }
  next();
};