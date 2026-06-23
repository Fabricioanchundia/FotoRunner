import Bull from 'bull';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';
import { subirFotoCompleta } from '../services/storage.service';
import logger from '../utils/logger';
import axios from 'axios';

const prisma = new PrismaClient();

export const fotosQueue = new Bull('fotos', {
  redis: process.env.REDIS_URL ?? 'redis://localhost:6379'
});

// Procesador del job
fotosQueue.process(async (job) => {
  const { photoId, gcsOriginalUrl } = job.data as {
    photoId: string;
    gcsOriginalUrl: string;
  };

  logger.info(`Procesando foto: ${photoId}`);

  try {
    // Descargar la imagen original
    const response = await axios.get(gcsOriginalUrl, {
      responseType: 'arraybuffer'
    });
    const bufferOriginal = Buffer.from(response.data as ArrayBuffer);

    // Agregar marca de agua con Sharp
    const marcaDeAgua = Buffer.from(`
      <svg width="400" height="60">
        <rect width="400" height="60" fill="rgba(0,0,0,0.5)" rx="8"/>
        <text x="200" y="38"
          font-family="Arial"
          font-size="28"
          font-weight="bold"
          fill="white"
          text-anchor="middle"
          opacity="0.9">
          fotorunner.ec
        </text>
      </svg>
    `);

    const bufferWatermark = await sharp(bufferOriginal)
      .composite([{
        input: marcaDeAgua,
        gravity: 'south'
      }])
      .jpeg({ quality: 85 })
      .toBuffer();

    // Subir AMBAS versiones (original al bucket privado, marca al
    // público) usando el mismo servicio de Cloud Storage que usa el
    // flujo síncrono de subida directa.
    const { urlPublica } = await subirFotoCompleta(
      bufferOriginal,
      bufferWatermark,
      `${photoId}.jpg`,
      'image/jpeg'
    );

    // Actualizar la foto en la base de datos
    await prisma.photo.update({
      where: { id: photoId },
      data: {
        gcs_watermark_url: urlPublica,
        processed_at: new Date()
      }
    });

    logger.info(`Foto procesada exitosamente: ${photoId}`);
    return { success: true, photoId, urlMarca: urlPublica };
  } catch (error) {
    logger.error(`Error procesando foto ${photoId}: ${error}`);
    throw error;
  }
});

// Eventos del queue
fotosQueue.on('completed', (job) => {
  logger.info(`Job de foto completado: ${job.id}`);
});

fotosQueue.on('failed', (job, error) => {
  logger.error(`Job de foto fallido ${job.id}: ${error}`);
});

// Función para agregar foto a la cola
export const agregarFotoACola = async (
  photoId: string,
  gcsOriginalUrl: string
): Promise<void> => {
  await fotosQueue.add(
    { photoId, gcsOriginalUrl },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    }
  );
  logger.info(`Foto agregada a la cola: ${photoId}`);
};