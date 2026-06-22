import path from 'path';
import { Storage } from '@google-cloud/storage';
import logger from '../utils/logger';

// Mismo patrón de credenciales que usa ms-facial: el archivo
// google-credentials.json vive en la raíz del proyecto (Monolito) y se
// apunta vía GOOGLE_APPLICATION_CREDENTIALS antes de crear el cliente.
const credentialsPath = path.join(process.cwd(), 'google-credentials.json');
process.env['GOOGLE_APPLICATION_CREDENTIALS'] = credentialsPath;

const storage = new Storage({
  projectId: process.env['GOOGLE_CLOUD_PROJECT_ID'] ?? 'fotorunner-ec'
});

// Dos buckets, separados a propósito:
// - PÚBLICO: solo fotos CON marca de agua. Cualquiera puede verlas (preview gratis).
// - PRIVADO: fotos originales SIN marca. Nunca se hacen públicas; solo se
//   entregan vía Signed URL después de confirmar el pago.
const bucketPublico = storage.bucket(
  process.env['GOOGLE_CLOUD_STORAGE_BUCKET_PUBLICO'] ?? 'fotorunner-ec-fotos'
);
const bucketPrivado = storage.bucket(
  process.env['GOOGLE_CLOUD_STORAGE_BUCKET_PRIVADO'] ?? 'fotorunner-ec-originales'
);

interface ResultadoSubida {
  urlPublica: string;
  pathPrivado: string;
}

// Sube AMBAS versiones de una foto: la original al bucket privado
// (nunca pública) y la versión con marca de agua al bucket público.
export const subirFotoCompleta = async (
  bufferOriginal: Buffer,
  bufferWatermark: Buffer,
  nombreBase: string,
  contentType: string
): Promise<ResultadoSubida> => {
  try {
    const nombreOriginal = `originales/${nombreBase}`;
    const nombreWatermark = `fotos/wm_${nombreBase}`;

    await bucketPrivado.file(nombreOriginal).save(bufferOriginal, {
      contentType,
      resumable: false
    });

    await bucketPublico.file(nombreWatermark).save(bufferWatermark, {
      contentType,
      resumable: false
    });

    const urlPublica = `https://storage.googleapis.com/${bucketPublico.name}/${nombreWatermark}`;

    logger.info(`Foto subida a GCS — pública: ${urlPublica}, privada: ${nombreOriginal}`);

    return { urlPublica, pathPrivado: nombreOriginal };
  } catch (error) {
    logger.error(`Error al subir foto a GCS: ${error}`);
    throw new Error('Error al subir la foto al almacenamiento en la nube');
  }
};

// Genera una URL firmada temporal (1 hora) para descargar la foto
// ORIGINAL sin marca de agua. Solo se llama después de confirmar un pago.
export const generarUrlFirmadaOriginal = async (
  pathPrivado: string
): Promise<string> => {
  try {
    const [url] = await bucketPrivado.file(pathPrivado).getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000 // 1 hora
    });
    return url;
  } catch (error) {
    logger.error(`Error al generar URL firmada: ${error}`);
    throw new Error('Error al generar la URL de descarga');
  }
};

// Elimina ambas versiones de una foto (privada y pública).
export const eliminarFotoCompleta = async (
  pathPrivado: string,
  pathPublico: string
): Promise<void> => {
  try {
    await Promise.all([
      bucketPrivado.file(pathPrivado).delete().catch(() => {}),
      bucketPublico.file(pathPublico).delete().catch(() => {})
    ]);
    logger.info(`Foto eliminada de GCS: ${pathPrivado} / ${pathPublico}`);
  } catch (error) {
    logger.error(`Error al eliminar foto de GCS: ${error}`);
    throw new Error('Error al eliminar la foto del almacenamiento');
  }
};