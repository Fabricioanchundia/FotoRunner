import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { responderExito, responderError } from '../utils/response';
import logger from '../utils/logger';
import { RequestAutenticado } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

const schemaSubirFoto = z.object({
  event_id: z.string().min(1, 'El ID del evento es requerido'),
  gcs_original_url: z.string().url('URL inválida'),
  gcs_watermark_url: z.string().url('URL inválida').optional()
});

export const listarFotosEvento = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const event_id = String(req.params['id']);

    const evento = await prisma.event.findUnique({
      where: { id: event_id }
    });

    if (!evento) {
      responderError(res, 'Evento no encontrado', 404);
      return;
    }

    const fotos = await prisma.photo.findMany({
      where: { event_id },
      orderBy: { created_at: 'desc' }
    });

    responderExito(res, fotos, 'Fotos obtenidas exitosamente');
  } catch (error) {
    logger.error(`Error al listar fotos: ${error}`);
    responderError(res, 'Error al obtener fotos', 500);
  }
};

export const listarMisFotos = async (
  req: RequestAutenticado,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.usuario!.id;
    const event_id = req.query['event_id']
      ? String(req.query['event_id'])
      : undefined;

    const matches = await prisma.faceMatch.findMany({
      where: {
        user_id,
        ...(event_id && {
          foto: { event_id }
        })
      },
      include: {
        foto: true
      },
      orderBy: { created_at: 'desc' }
    });

    const fotos = matches.map((m) => ({
      ...m.foto,
      confidence_score: m.confidence_score
    }));

    responderExito(res, fotos, 'Mis fotos obtenidas exitosamente');
  } catch (error) {
    logger.error(`Error al listar mis fotos: ${error}`);
    responderError(res, 'Error al obtener mis fotos', 500);
  }
};

export const subirFoto = async (
  req: RequestAutenticado,
  res: Response
): Promise<void> => {
  try {
    const datos = schemaSubirFoto.safeParse(req.body);
    if (!datos.success) {
      responderError(res, 'Datos inválidos', 400, datos.error.issues);
      return;
    }

    const evento = await prisma.event.findUnique({
      where: { id: datos.data.event_id }
    });

    if (!evento) {
      responderError(res, 'Evento no encontrado', 404);
      return;
    }

    if (evento.admin_id !== req.usuario!.id) {
      responderError(res, 'Solo el admin del evento puede subir fotos', 403);
      return;
    }

    const foto = await prisma.photo.create({
      data: {
        event_id: datos.data.event_id,
        gcs_original_url: datos.data.gcs_original_url,
        gcs_watermark_url: datos.data.gcs_watermark_url ?? null
      }
    });

    logger.info(`Foto subida al evento ${datos.data.event_id}`);
    responderExito(res, foto, 'Foto subida exitosamente', 201);
  } catch (error) {
    logger.error(`Error al subir foto: ${error}`);
    responderError(res, 'Error al subir foto', 500);
  }
};

export const eliminarFoto = async (
  req: RequestAutenticado,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params['id']);

    const foto = await prisma.photo.findUnique({
      where: { id },
      include: { evento: true }
    });

    if (!foto) {
      responderError(res, 'Foto no encontrada', 404);
      return;
    }

    if (foto.evento.admin_id !== req.usuario!.id) {
      responderError(res, 'Solo el admin puede eliminar fotos', 403);
      return;
    }

    await prisma.photo.delete({ where: { id } });

    logger.info(`Foto eliminada: ${id}`);
    responderExito(res, null, 'Foto eliminada exitosamente');
  } catch (error) {
    logger.error(`Error al eliminar foto: ${error}`);
    responderError(res, 'Error al eliminar foto', 500);
  }
};