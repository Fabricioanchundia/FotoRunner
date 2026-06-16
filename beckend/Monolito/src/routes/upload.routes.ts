import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { verificarToken, soloAdmin } from '../middlewares/auth.middleware';
import { responderExito, responderError } from '../utils/response';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads');
const watermarkDir = path.join(process.cwd(), 'uploads', 'watermarked');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(watermarkDir)) fs.mkdirSync(watermarkDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const nombre = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    cb(null, nombre);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const tipos = ['image/jpeg', 'image/png', 'image/webp'];
    if (tipos.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Solo imágenes JPG, PNG o WEBP'));
  }
});

// Genera marca de agua con texto FOTORUNNER
const generarMarcaAgua = async (inputPath: string, outputPath: string): Promise<void> => {
  const imagen = sharp(inputPath);
  const metadata = await imagen.metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 600;

  // SVG con texto diagonal repetido como marca de agua
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

  await imagen
    .composite([{
      input: Buffer.from(svgMarca),
      top: 0,
      left: 0,
      blend: 'over'
    }])
    .jpeg({ quality: 85 })
    .toFile(outputPath);
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

    const BASE_URL = process.env['BACKEND_URL'] || 'http://localhost:3001';
    const urlOriginal = `${BASE_URL}/uploads/${req.file.filename}`;

    try {
      // Generar versión con marca de agua
      const watermarkFilename = `wm_${req.file.filename}`;
      const watermarkPath = path.join(watermarkDir, watermarkFilename);

      await generarMarcaAgua(req.file.path, watermarkPath);

      const urlWatermark = `${BASE_URL}/uploads/watermarked/${watermarkFilename}`;

      responderExito(res, {
        url: urlOriginal,
        url_watermark: urlWatermark
      }, 'Foto subida exitosamente');
    } catch (err) {
      // Si falla la marca de agua, devolver solo la original
      console.error('Error generando marca de agua:', err);
      responderExito(res, {
        url: urlOriginal,
        url_watermark: urlOriginal
      }, 'Foto subida (sin marca de agua)');
    }
  }
);

export default router;