import { Router, Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { verificarToken, soloAdmin } from '../middlewares/auth.middleware';
import { responderExito, responderError } from '../utils/response';
import { subirFotoCompleta } from '../services/storage.service';

const router = Router();

// Almacenamiento EN MEMORIA — el archivo nunca se escribe en disco local.
// Esto es necesario para producción: el contenedor/servidor puede
// reiniciarse o redeployarse sin perder fotos, porque nada vive en su
// propio disco efímero. Todo va directo a Google Cloud Storage.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const tipos = ['image/jpeg', 'image/png', 'image/webp'];
    if (tipos.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Solo imágenes JPG, PNG o WEBP'));
  }
});

// Genera un buffer con marca de agua con texto FOTORUNNER, a partir del
// buffer original en memoria (sin pasar por disco).
const generarMarcaAguaBuffer = async (bufferOriginal: Buffer): Promise<Buffer> => {
  const imagen = sharp(bufferOriginal);
  const metadata = await imagen.metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 600;

  const margen = 120;
  const textos: string[] = [];

  for (let y = 0; y < height + margen; y += margen) {
    for (let x = -margen; x < width + margen; x += 260) {
      textos.push(`
        <text
          x="${x}" y="${y}"
          transform="rotate(-30, ${x}, ${y})"
          font-family="Arial, sans-serif"
          font-size="22"
          font-weight="bold"
          fill="rgba(255,255,255,0.35)"
          letter-spacing="4"
        >FOTORUNNER.EC</text>
      `);
    }
  }

  const svgMarca = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${textos.join('')}
    </svg>
  `;

  return imagen
    .composite([{
      input: Buffer.from(svgMarca),
      top: 0,
      left: 0,
      blend: 'over'
    }])
    .jpeg({ quality: 85 })
    .toBuffer();
};

// Procesa un archivo individual: genera su marca de agua y lo sube a
// ambos buckets. Reutilizada tanto por /foto (una sola) como por
// /fotos (varias a la vez).
const procesarYSubirArchivo = async (file: Express.Multer.File) => {
  const nombreBase = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const bufferWatermark = await generarMarcaAguaBuffer(file.buffer);
  const { urlPublica, pathPrivado } = await subirFotoCompleta(
    file.buffer,
    bufferWatermark,
    nombreBase,
    file.mimetype
  );
  return { url: pathPrivado, url_watermark: urlPublica };
};

router.post(
  '/foto',
  verificarToken,
  soloAdmin,
  upload.single('foto'),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      responderError(res, 'No se recibió ningún archivo', 400);
      return;
    }

    try {
      const resultado = await procesarYSubirArchivo(req.file);
      responderExito(res, resultado, 'Foto subida exitosamente a la nube');
    } catch (err) {
      console.error('Error al subir foto a la nube:', err);
      responderError(res, 'Error al subir la foto. Intenta de nuevo.', 500);
    }
  }
);

// Subida múltiple — hasta 30 fotos en una sola petición. Cada archivo
// se procesa en paralelo (marca de agua + subida a ambos buckets).
router.post(
  '/fotos',
  verificarToken,
  soloAdmin,
  upload.array('fotos', 30),
  async (req: Request, res: Response): Promise<void> => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      responderError(res, 'No se recibió ningún archivo', 400);
      return;
    }

    try {
      const resultados = await Promise.all(
        files.map((file) => procesarYSubirArchivo(file))
      );
      responderExito(res, resultados, `${resultados.length} fotos subidas exitosamente a la nube`);
    } catch (err) {
      console.error('Error al subir fotos a la nube:', err);
      responderError(res, 'Error al subir las fotos. Intenta de nuevo.', 500);
    }
  }
);

export default router;