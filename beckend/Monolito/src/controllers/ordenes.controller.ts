import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { responderExito, responderError } from '../utils/response';
import logger from '../utils/logger';
import { RequestAutenticado } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

const schemaCrearOrden = z.object({
  event_id: z.string().min(1),
  package_id: z.string().optional(),
  photo_ids: z.array(z.string()).optional(),
  payment_method: z.enum(['PAYPHONE', 'STRIPE'])
});

export const listarMisOrdenes = async (
  req: RequestAutenticado,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.usuario!.id;

    const ordenes = await prisma.order.findMany({
      where: { user_id },
      include: {
        evento: {
          select: { id: true, nombre: true, fecha: true, ciudad: true }
        },
        package: true,
        fotos: {
          include: { foto: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    responderExito(res, ordenes, 'Órdenes obtenidas exitosamente');
  } catch (error) {
    logger.error(`Error al listar órdenes: ${error}`);
    responderError(res, 'Error al obtener órdenes', 500);
  }
};

export const obtenerOrden = async (
  req: RequestAutenticado,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params['id']);

    const orden = await prisma.order.findUnique({
      where: { id },
      include: {
        evento: true,
        package: true,
        fotos: { include: { foto: true } }
      }
    });

    if (!orden) {
      responderError(res, 'Orden no encontrada', 404);
      return;
    }

    if (orden.user_id !== req.usuario!.id) {
      responderError(res, 'No tienes acceso a esta orden', 403);
      return;
    }

    responderExito(res, orden, 'Orden obtenida exitosamente');
  } catch (error) {
    logger.error(`Error al obtener orden: ${error}`);
    responderError(res, 'Error al obtener orden', 500);
  }
};

export const crearOrden = async (
  req: RequestAutenticado,
  res: Response
): Promise<void> => {
  try {
    const datos = schemaCrearOrden.safeParse(req.body);
    if (!datos.success) {
      responderError(res, 'Datos inválidos', 400, datos.error.issues);
      return;
    }

    const { event_id, package_id, photo_ids, payment_method } = datos.data;

    let total_usd = 0;

    // Calcular total según paquete o fotos individuales
    if (package_id) {
      const paquete = await prisma.package.findUnique({
        where: { id: package_id }
      });
      if (!paquete) {
        responderError(res, 'Paquete no encontrado', 404);
        return;
      }
      total_usd = paquete.price_usd;
    } else if (photo_ids && photo_ids.length > 0) {
      total_usd = photo_ids.length * 2.99;
    } else {
      responderError(res, 'Debes seleccionar un paquete o fotos individuales', 400);
      return;
    }

    // Crear la orden
    const orden = await prisma.order.create({
      data: {
        user_id: req.usuario!.id,
        event_id,
        package_id: package_id ?? null,
        total_usd,
        payment_method,
        status: 'PENDIENTE',
        fotos: {
          create: (photo_ids ?? []).map((photo_id) => ({ photo_id }))
        }
      },
      include: {
        fotos: { include: { foto: true } },
        evento: { select: { id: true, nombre: true } }
      }
    });

    logger.info(`Orden creada: ${orden.id} por usuario ${req.usuario!.id}`);
    responderExito(res, orden, 'Orden creada exitosamente', 201);
  } catch (error) {
    logger.error(`Error al crear orden: ${error}`);
    responderError(res, 'Error al crear orden', 500);
  }
};