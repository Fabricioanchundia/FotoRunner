import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { responderExito, responderError } from '../utils/response';
import logger from '../utils/logger';
import { RequestAutenticado } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();
const MS_FACIAL_URL = process.env['MS_FACIAL_URL'] || 'http://localhost:3002';
const MS_FACIAL_API_KEY = process.env['INTERNAL_API_KEY'] || '';

const schemaActualizar = z.object({
  nombre: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatar_url: z.string().optional()
});

export const obtenerUsuario = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params['id']);

    const usuario = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, nombre: true, email: true, phone: true,
        role: true, avatar_url: true, email_verified: true,
        phone_verified: true, created_at: true
      }
    });

    if (!usuario) {
      responderError(res, 'Usuario no encontrado', 404);
      return;
    }

    responderExito(res, usuario, 'Usuario obtenido exitosamente');
  } catch (error) {
    logger.error(`Error al obtener usuario: ${error}`);
    responderError(res, 'Error al obtener usuario', 500);
  }
};

export const actualizarUsuario = async (
  req: RequestAutenticado,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params['id']);

    if (req.usuario?.id !== id) {
      responderError(res, 'No tienes permiso para editar este usuario', 403);
      return;
    }

    const datos = schemaActualizar.safeParse(req.body);
    if (!datos.success) {
      responderError(res, 'Datos inválidos', 400, datos.error.issues);
      return;
    }

    const usuario = await prisma.user.update({
      where: { id },
      data: datos.data,
      select: {
        id: true, nombre: true, email: true, phone: true,
        avatar_url: true, updated_at: true
      }
    });

    // Si actualizó el avatar, registrar vector facial en ms-facial
    if (datos.data.avatar_url) {
      try {
        await fetch(`${MS_FACIAL_URL}/api/facial/registrar-vector`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-api-key': MS_FACIAL_API_KEY
          },
          body: JSON.stringify({
            user_id: id,
            avatar_url: datos.data.avatar_url
          })
        });
        logger.info(`Vector facial registrado para usuario ${id}`);
      } catch (err) {
        logger.warn(`MS-Facial no disponible al registrar vector: ${err}`);
      }
    }

    logger.info(`Usuario actualizado: ${id}`);
    responderExito(res, usuario, 'Usuario actualizado exitosamente');
  } catch (error) {
    logger.error(`Error al actualizar usuario: ${error}`);
    responderError(res, 'Error al actualizar usuario', 500);
  }
};