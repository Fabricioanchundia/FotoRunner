import Bull from 'bull';
import { PrismaClient } from '@prisma/client';
import { enviarEmailCompra, enviarEmailPreview } from '../services/email.service';
import { enviarWhatsAppCompra, enviarWhatsAppPreview } from '../services/whatsapp.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export const notificacionesQueue = new Bull('notificaciones', {
  redis: process.env.REDIS_URL ?? 'redis://localhost:6379'
});

// Procesador del job
notificacionesQueue.process(async (job) => {
  const { tipo, userId, eventoId, linkUrl } = job.data as {
    tipo: 'COMPRA' | 'PREVIEW';
    userId: string;
    eventoId: string;
    linkUrl: string;
  };

  logger.info(`Procesando notificación ${tipo} para usuario: ${userId}`);

  try {
    const usuario = await prisma.user.findUnique({
      where: { id: userId }
    });

    const evento = await prisma.event.findUnique({
      where: { id: eventoId }
    });

    if (!usuario || !evento) {
      throw new Error('Usuario o evento no encontrado');
    }

    // Enviar email
    try {
      if (tipo === 'COMPRA') {
        await enviarEmailCompra(
          usuario.email,
          usuario.nombre,
          evento.nombre,
          linkUrl
        );
      } else {
        await enviarEmailPreview(
          usuario.email,
          usuario.nombre,
          evento.nombre,
          linkUrl
        );
      }

      await prisma.notification.create({
        data: {
          user_id: userId,
          type: tipo,
          channel: 'EMAIL',
          status: 'ENVIADO',
          sent_at: new Date()
        }
      });
    } catch (error) {
      logger.error(`Error enviando email: ${error}`);
      await prisma.notification.create({
        data: {
          user_id: userId,
          type: tipo,
          channel: 'EMAIL',
          status: 'FALLIDO'
        }
      });
    }

    // Enviar WhatsApp si tiene teléfono
    if (usuario.phone) {
      try {
        if (tipo === 'COMPRA') {
          await enviarWhatsAppCompra(
            usuario.phone,
            usuario.nombre,
            evento.nombre,
            linkUrl
          );
        } else {
          await enviarWhatsAppPreview(
            usuario.phone,
            usuario.nombre,
            evento.nombre,
            linkUrl
          );
        }

        await prisma.notification.create({
          data: {
            user_id: userId,
            type: tipo,
            channel: 'WHATSAPP',
            status: 'ENVIADO',
            sent_at: new Date()
          }
        });
      } catch (error) {
        logger.error(`Error enviando WhatsApp: ${error}`);
        await prisma.notification.create({
          data: {
            user_id: userId,
            type: tipo,
            channel: 'WHATSAPP',
            status: 'FALLIDO'
          }
        });
      }
    }

    logger.info(`Notificación procesada exitosamente para: ${userId}`);
    return { success: true };
  } catch (error) {
    logger.error(`Error procesando notificación: ${error}`);
    throw error;
  }
});

notificacionesQueue.on('completed', (job) => {
  logger.info(`Job de notificación completado: ${job.id}`);
});

notificacionesQueue.on('failed', (job, error) => {
  logger.error(`Job de notificación fallido ${job.id}: ${error}`);
});

// Función para agregar notificación a la cola
export const agregarNotificacion = async (
  tipo: 'COMPRA' | 'PREVIEW',
  userId: string,
  eventoId: string,
  linkUrl: string
): Promise<void> => {
  await notificacionesQueue.add(
    { tipo, userId, eventoId, linkUrl },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 }
    }
  );
  logger.info(`Notificación agregada a la cola: ${tipo} para ${userId}`);
};