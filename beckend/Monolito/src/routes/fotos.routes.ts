import { Router } from 'express';
import {
  listarFotosEvento,
  listarMisFotos,
  subirFoto,
  usarComoPortada,
  eliminarFoto
} from '../controllers/fotos.controller';
import { verificarToken, soloAdmin } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/fotos/evento/:id (público)
router.get('/evento/:id', listarFotosEvento);

// GET /api/fotos/mis-fotos (requiere login)
router.get('/mis-fotos', verificarToken, listarMisFotos);

// POST /api/fotos (solo admin)
router.post('/', verificarToken, soloAdmin, subirFoto);

// PUT /api/fotos/:id/portada (solo admin) — usar esta foto como portada del evento
router.put('/:id/portada', verificarToken, soloAdmin, usarComoPortada);

// DELETE /api/fotos/:id (solo admin)
router.delete('/:id', verificarToken, soloAdmin, eliminarFoto);

export default router;