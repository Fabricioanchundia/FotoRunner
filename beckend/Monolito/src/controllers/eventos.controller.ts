import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { responderExito, responderError } from '../utils/response';
import logger from '../utils/logger';
import { RequestAutenticado } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

const schemaEvento = z.object({
  nombre: z.string().min(3),
  descripcion: z.string().optional(),
  fecha: z.string().datetime(),
  ciudad: z.string().min(2),
  tipo: z.enum(['RUNNING', 'ATLETISMO', 'CICLISMO']),
  cover_url: z.string().url().optional(),
  disponible_hasta: z.string().datetime().optional()
});

export const listarEventos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { ciudad, tipo, status } = req.query;

    const eventos = await prisma.event.findMany({
      where: {
        ...(ciudad && { ciudad: { contains: String(ciudad), mode: 'insensitive' } }),
        ...(tipo && { tipo: tipo as 'RUNNING' | 'ATLETISMO' | 'CICLISMO' }),
        ...(status && { status: status as 'PROXIMO' | 'ACTIVO' | 'COMPLETADO' })
      },
      orderBy: { fecha: 'asc' },
      include: {
        admin: { select: { id: true, nombre: true } },
        _count: { select: { fotos: true } }
      }
    });

    responderExito(res, eventos, 'Eventos obtenidos exitosamente');
  } catch (error) {
    logger.error(`Error al listar eventos: ${error}`);
    responderError(res, 'Error al obtener eventos', 500);
  }
};

export const obtenerEvento = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params['id']);

    const evento = await prisma.event.findUnique({
      where: { id },
      include: {
        admin: { select: { id: true, nombre: true } },
        packages: true,
        _count: { select: { fotos: true } }
      }
    });

    if (!evento) {
      responderError(res, 'Evento no encontrado', 404);
      return;
    }

    responderExito(res, evento, 'Evento obtenido exitosamente');
  } catch (error) {
    logger.error(`Error al obtener evento: ${error}`);
    responderError(res, 'Error al obtener evento', 500);
  }
};

export const crearEvento = async (
  req: RequestAutenticado,
  res: Response
): Promise<void> => {
  try {
    const datos = schemaEvento.safeParse(req.body);
    if (!datos.success) {
      responderError(res, 'Datos inválidos', 400, datos.error.issues);
      return;
    }

    const evento = await prisma.event.create({
      data: {
        ...datos.data,
        fecha: new Date(datos.data.fecha),
        ...(datos.data.disponible_hasta && { disponible_hasta: new Date(datos.data.disponible_hasta) }),
        admin_id: req.usuario!.id
      }
    });

    logger.info(`Evento creado: ${evento.nombre}`);
    responderExito(res, evento, 'Evento creado exitosamente', 201);
  } catch (error) {
    logger.error(`Error al crear evento: ${error}`);
    responderError(res, 'Error al crear evento', 500);
  }
};

export const actualizarEvento = async (
  req: RequestAutenticado,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params['id']);

    const evento = await prisma.event.findUnique({ where: { id } });
    if (!evento) {
      responderError(res, 'Evento no encontrado', 404);
      return;
    }

    if (evento.admin_id !== req.usuario!.id) {
      responderError(res, 'No tienes permiso para editar este evento', 403);
      return;
    }

    const schemaActualizar = schemaEvento.partial().extend({
      status: z.enum(['PROXIMO', 'ACTIVO', 'COMPLETADO']).optional()
    });

    const datos = schemaActualizar.safeParse(req.body);
    if (!datos.success) {
      responderError(res, 'Datos inválidos', 400, datos.error.issues);
      return;
    }

    const eventoActualizado = await prisma.event.update({
      where: { id },
      data: {
        ...datos.data,
        ...(datos.data.fecha && { fecha: new Date(datos.data.fecha) }),
        ...(datos.data.disponible_hasta && { disponible_hasta: new Date(datos.data.disponible_hasta) })
      }
    });

    logger.info(`Evento actualizado: ${id}`);
    responderExito(res, eventoActualizado, 'Evento actualizado exitosamente');
  } catch (error) {
    logger.error(`Error al actualizar evento: ${error}`);
    responderError(res, 'Error al actualizar evento', 500);
  }
};