import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { responderExito, responderError } from '../utils/response';
import logger from '../utils/logger';
import { RequestAutenticado } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

export const obtenerStats = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const [totalUsuarios, totalEventos, totalFotos, totalOrdenes, ingresoTotal] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.photo.count(),
      prisma.order.count({ where: { status: 'PAGADO' } }),
      prisma.order.aggregate({ where: { status: 'PAGADO' }, _sum: { total_usd: true } })
    ]);

    responderExito(res, {
      totalUsuarios,
      totalEventos,
      totalFotos,
      totalOrdenes,
      ingresoTotal: ingresoTotal._sum.total_usd || 0
    }, 'Stats obtenidas');
  } catch (error) {
    logger.error(`Error stats: ${error}`);
    responderError(res, 'Error al obtener stats', 500);
  }
};

export const listarUsuarios = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const usuarios = await prisma.user.findMany({
      select: {
        id: true, nombre: true, email: true, phone: true,
        role: true, email_verified: true, phone_verified: true,
        avatar_url: true, created_at: true,
        _count: { select: { ordenes: true, face_matches: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    responderExito(res, usuarios, 'Usuarios obtenidos');
  } catch (error) {
    logger.error(`Error listar usuarios: ${error}`);
    responderError(res, 'Error al obtener usuarios', 500);
  }
};

export const listarTodasFotos = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const fotos = await prisma.photo.findMany({
      include: { evento: { select: { id: true, nombre: true, ciudad: true } } },
      orderBy: { created_at: 'desc' },
      take: 100
    });
    responderExito(res, fotos, 'Fotos obtenidas');
  } catch (error) {
    logger.error(`Error listar fotos: ${error}`);
    responderError(res, 'Error al obtener fotos', 500);
  }
};

export const eliminarFotoAdmin = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const id = String(req.params['id']);
    await prisma.orderPhoto.deleteMany({ where: { photo_id: id } });
    await prisma.faceMatch.deleteMany({ where: { photo_id: id } });
    await prisma.photo.delete({ where: { id } });
    responderExito(res, null, 'Foto eliminada');
  } catch (error) {
    logger.error(`Error eliminar foto: ${error}`);
    responderError(res, 'Error al eliminar foto', 500);
  }
};

export const cambiarRolUsuario = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const id = String(req.params['id']);
    const { role } = req.body;
    if (!['USER', 'ADMIN'].includes(role)) {
      responderError(res, 'Rol inválido', 400);
      return;
    }
    const usuario = await prisma.user.update({
      where: { id }, data: { role },
      select: { id: true, nombre: true, email: true, role: true }
    });
    responderExito(res, usuario, 'Rol actualizado');
  } catch (error) {
    logger.error(`Error cambiar rol: ${error}`);
    responderError(res, 'Error al cambiar rol', 500);
  }
};

export const cambiarStatusEvento = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const id = String(req.params['id']);
    const { status } = req.body;
    if (!['PROXIMO', 'ACTIVO', 'COMPLETADO'].includes(status)) {
      responderError(res, 'Status inválido', 400);
      return;
    }
    const evento = await prisma.event.update({ where: { id }, data: { status } });
    responderExito(res, evento, 'Status actualizado');
  } catch (error) {
    logger.error(`Error cambiar status: ${error}`);
    responderError(res, 'Error al cambiar status', 500);
  }
};