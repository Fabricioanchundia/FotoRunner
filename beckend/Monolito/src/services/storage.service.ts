import { Storage } from '@google-cloud/storage';
import logger from '../utils/logger';

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
});

const bucket = storage.bucket(
  process.env.GOOGLE_CLOUD_STORAGE_BUCKET ?? 'fotorunner-fotos'
);

// Subir archivo a GCS
export const subirArchivo = async (
  buffer: Buffer,
  destino: string,
  contentType: string
): Promise<string> => {
  try {
    const archivo = bucket.file(destino);

    await archivo.save(buffer, {
      contentType,
      resumable: false
    });

    const url = `https://storage.googleapis.com/${bucket.name}/${destino}`;
    logger.info(`Archivo subido a GCS: ${url}`);
    return url;
  } catch (error) {
    logger.error(`Error al subir archivo a GCS: ${error}`);
    throw new Error('Error al subir archivo al almacenamiento');
  }
};

// Generar URL firmada (expira en 1 hora)
export const generarUrlFirmada = async (
  nombreArchivo: string
): Promise<string> => {
  try {
    const archivo = bucket.file(nombreArchivo);

    const [url] = await archivo.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000 // 1 hora
    });

    return url;
  } catch (error) {
    logger.error(`Error al generar URL firmada: ${error}`);
    throw new Error('Error al generar URL de descarga');
  }
};

// Eliminar archivo de GCS
export const eliminarArchivo = async (
  nombreArchivo: string
): Promise<void> => {
  try {
    await bucket.file(nombreArchivo).delete();
    logger.info(`Archivo eliminado de GCS: ${nombreArchivo}`);
  } catch (error) {
    logger.error(`Error al eliminar archivo de GCS: ${error}`);
    throw new Error('Error al eliminar archivo');
  }
};