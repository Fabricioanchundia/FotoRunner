import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { responderExito, responderError } from '../utils/response';
import logger from '../utils/logger';
import { RequestAutenticado } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();
const MS_FACIAL_URL = process.env['MS_FACIAL_URL'] || 'http://localhost:3002';

const schemaSubirFoto = z.object({
  event_id: z.string().min(1, 'El ID del evento es requerido'),
  // gcs_original_url ya no es necesariamente una URL completa: desde la
  // migración a Cloud Storage, es el PATH interno dentro del bucket
  // privado (ej. "originales/123.jpg"), usado luego para generar Signed
  // URLs tras el pago. Solo se exige que no esté vacío.
  gcs_original_url: z.string().min(1, 'La referencia de la foto es requerida'),
  gcs_watermark_url: z.string().url('URL inválida').optional()
});

export const listarFotosEvento = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const event_id = String(req.params['id']);

    const evento = await prisma.event.findUnique({ where: { id: event_id } });
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

    // Intentar usar ms-facial primero
    try {
      const url = `${MS_FACIAL_URL}/api/facial/buscar/${user_id}${event_id ? `?event_id=${event_id}` : ''}`;
      const response = await fetch(url);
      const data = await response.json() as { exito: boolean; datos: any[] };

      if (data.exito && Array.isArray(data.datos)) {
        responderExito(res, data.datos, 'Mis fotos obtenidas exitosamente');
        return;
      }
    } catch (err) {
      logger.warn(`MS-Facial no disponible, usando fallback: ${err}`);
    }

    // Fallback — buscar directamente en la BD
    const matches = await prisma.faceMatch.findMany({
      where: {
        user_id,
        ...(event_id && { foto: { event_id } })
      },
      include: { foto: true },
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

    if (evento.admin_id !== req.usuario!.id && req.usuario?.role !== 'ADMIN') {
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

    // Notificar al ms-facial en background — no bloquea la respuesta.
    // IMPORTANTE: se manda la URL PÚBLICA con marca de agua, no
    // gcs_original_url (que ahora es solo un path interno del bucket
    // privado, no una URL navegable que Cloud Vision pueda descargar).
    const urlParaDeteccion = foto.gcs_watermark_url || foto.gcs_original_url;
    fetch(`${MS_FACIAL_URL}/api/facial/procesar-foto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photo_id: foto.id,
        photo_url: urlParaDeteccion
      })
    }).catch(err => logger.warn(`MS-Facial procesar-foto error: ${err}`));

    logger.info(`Foto subida al evento ${datos.data.event_id}`);
    responderExito(res, foto, 'Foto subida exitosamente', 201);
  } catch (error) {
    logger.error(`Error al subir foto: ${error}`);
    responderError(res, 'Error al subir foto', 500);
  }
};

const schemaSubirFotosMultiple = z.object({
  event_id: z.string().min(1, 'El ID del evento es requerido'),
  fotos: z.array(z.object({
    gcs_original_url: z.string().min(1),
    gcs_watermark_url: z.string().url().optional()
  })).min(1, 'Debes incluir al menos una foto')
});

// Registra varias fotos de una sola vez (ya subidas previamente al
// almacenamiento vía POST /api/upload/fotos). Reutiliza la misma
// validación de evento/permisos que subirFoto, una sola vez para todo
// el lote en vez de repetirla por cada foto.
export const subirFotosMultiple = async (
  req: RequestAutenticado,
  res: Response
): Promise<void> => {
  try {
    const datos = schemaSubirFotosMultiple.safeParse(req.body);
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

    if (evento.admin_id !== req.usuario!.id && req.usuario?.role !== 'ADMIN') {
      responderError(res, 'Solo el admin del evento puede subir fotos', 403);
      return;
    }

    const fotosCreadas = await prisma.$transaction(
      datos.data.fotos.map((f) =>
        prisma.photo.create({
          data: {
            event_id: datos.data.event_id,
            gcs_original_url: f.gcs_original_url,
            gcs_watermark_url: f.gcs_watermark_url ?? null
          }
        })
      )
    );

    // La portada se actualiza con la última foto del lote, igual que en
    // la subida individual.
    const ultima = fotosCreadas[fotosCreadas.length - 1];
    if (ultima) {
      await prisma.event.update({
        where: { id: evento.id },
        data: { cover_url: ultima.gcs_watermark_url ?? ultima.gcs_original_url }
      });
    }

    // Notificar a ms-facial por cada foto, en background, sin bloquear.
    for (const foto of fotosCreadas) {
      const urlParaDeteccion = foto.gcs_watermark_url || foto.gcs_original_url;
      fetch(`${MS_FACIAL_URL}/api/facial/procesar-foto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_id: foto.id, photo_url: urlParaDeteccion })
      }).catch(err => logger.warn(`MS-Facial procesar-foto error: ${err}`));
    }

    logger.info(`${fotosCreadas.length} fotos subidas al evento ${datos.data.event_id}`);
    responderExito(res, fotosCreadas, `${fotosCreadas.length} fotos subidas exitosamente`, 201);
  } catch (error) {
    logger.error(`Error al subir fotos múltiples: ${error}`);
    responderError(res, 'Error al subir las fotos', 500);
  }
};

export const usarComoPortada = async (
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

    if (foto.evento.admin_id !== req.usuario!.id && req.usuario?.role !== 'ADMIN') {
      responderError(res, 'Solo el admin puede cambiar la portada', 403);
      return;
    }

    const evento = await prisma.event.update({
      where: { id: foto.event_id },
      data: { cover_url: foto.gcs_watermark_url ?? foto.gcs_original_url }
    });

    logger.info(`Portada del evento ${foto.event_id} actualizada con la foto ${id}`);
    responderExito(res, evento, 'Portada actualizada exitosamente');
  } catch (error) {
    logger.error(`Error al actualizar portada: ${error}`);
    responderError(res, 'Error al actualizar portada', 500);
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

    if (foto.evento.admin_id !== req.usuario!.id && req.usuario?.role !== 'ADMIN') {
      responderError(res, 'Solo el admin puede eliminar fotos', 403);
      return;
    }

    await prisma.orderPhoto.deleteMany({ where: { photo_id: id } });
    await prisma.faceMatch.deleteMany({ where: { photo_id: id } });
    await prisma.photo.delete({ where: { id } });

    logger.info(`Foto eliminada: ${id}`);
    responderExito(res, null, 'Foto eliminada exitosamente');
  } catch (error) {
    logger.error(`Error al eliminar foto: ${error}`);
    responderError(res, 'Error al eliminar foto', 500);
  }
};