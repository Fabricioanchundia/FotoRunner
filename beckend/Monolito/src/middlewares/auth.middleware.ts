import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import { responderError } from '../utils/response';

const prisma = new PrismaClient();

export interface RequestAutenticado extends Request {
  usuario?: {
    id: string;
    role: string;
    helper_permissions?: Record<string, boolean>;
  };
}

export const verificarToken = async (
  req: RequestAutenticado,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      responderError(res, 'Token requerido', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(
      token,
      process.env['JWT_SECRET'] || 'secret'
    ) as { id: string; role: string };

    if (payload.role === 'HELPER') {
      const usuario = await (prisma.user.findUnique as any)({
        where: { id: payload.id },
        select: {
          role: true,
          helper_expires_at: true,
          helper_permissions: true
        }
      });

      if (!usuario) {
        responderError(res, 'Usuario no encontrado', 401);
        return;
      }

      const expira = usuario.helper_expires_at
        ? new Date(usuario.helper_expires_at as unknown as string)
        : null;

      if (!expira || expira.getTime() < Date.now()) {
        await (prisma.user.update as any)({
          where: { id: payload.id },
          data: {
            role: Role.USER,
            helper_expires_at: null,
            helper_permissions: null
          }
        });
        responderError(res, 'Tu acceso de ayudante ha expirado', 401);
        return;
      }

      req.usuario = {
        id: payload.id,
        role: 'HELPER',
        helper_permissions: (usuario.helper_permissions as Record<string, boolean>) || {}
      };
    } else {
      req.usuario = { id: payload.id, role: payload.role };
    }

    next();
  } catch {
    responderError(res, 'Token inválido', 401);
  }
};

export const soloAdmin = (
  req: RequestAutenticado,
  res: Response,
  next: NextFunction
): void => {
  const role = req.usuario?.role;
  if (role !== 'ADMIN' && role !== 'HELPER') {
    responderError(res, 'Acceso denegado', 403);
    return;
  }
  next();
};

export const soloAdminPuro = (
  req: RequestAutenticado,
  res: Response,
  next: NextFunction
): void => {
  if (req.usuario?.role !== 'ADMIN') {
    responderError(res, 'Solo el administrador principal puede realizar esta acción', 403);
    return;
  }
  next();
};

export const verificarPermiso = (permiso: string) => {
  return (req: RequestAutenticado, res: Response, next: NextFunction): void => {
    if (req.usuario?.role === 'ADMIN') { next(); return; }
    const perms = req.usuario?.helper_permissions || {};
    if (!perms[permiso]) {
      responderError(res, `No tienes permiso para: ${permiso}`, 403);
      return;
    }
    next();
  };
};