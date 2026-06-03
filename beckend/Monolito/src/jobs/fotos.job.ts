import Bull from 'bull';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';
import { subirArchivo } from '../services/storage.service';
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
    const buffer = Buffer.from(response.data as ArrayBuffer);

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

    const imagenConMarca = await sharp(buffer)
      .composite([{
        input: marcaDeAgua,
        gravity: 'south'
      }])
      .jpeg({ quality: 85 })
      .toBuffer();

    // Subir versión con marca de agua a GCS
    const nombreArchivo = `watermark/${photoId}.jpg`;
    const urlMarca = await subirArchivo(
      imagenConMarca,
      nombreArchivo,
      'image/jpeg'
    );

    // Actualizar la foto en la base de datos
    await prisma.photo.update({
      where: { id: photoId },
      data: {
        gcs_watermark_url: urlMarca,
        processed_at: new Date()
      }
    });

    logger.info(`Foto procesada exitosamente: ${photoId}`);
    return { success: true, photoId, urlMarca };
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