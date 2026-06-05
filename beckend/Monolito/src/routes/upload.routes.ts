import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verificarToken, soloAdmin } from '../middlewares/auth.middleware';
import { responderExito, responderError } from '../utils/response';

const router = Router();

// Carpeta de uploads local (temporal hasta tener GCS)
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const nombre = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    cb(null, nombre);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const tipos = ['image/jpeg', 'image/png', 'image/webp'];
    if (tipos.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'));
  }
});

router.post('/foto', verificarToken, soloAdmin, upload.single('foto'), (req: Request, res: Response): void => {
  if (!req.file) {
    responderError(res, 'No se recibió ningún archivo', 400);
    return;
  }
  const url = `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/${req.file.filename}`;
  responderExito(res, { url }, 'Foto subida exitosamente');
});

export default router;