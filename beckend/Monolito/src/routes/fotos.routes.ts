import { Router } from 'express';
import {
  listarFotosEvento,
  listarMisFotos,
  subirFoto,
  subirFotosMultiple,
  usarComoPortada,
  eliminarFoto
} from '../controllers/fotos.controller';
import { verificarToken, soloAdmin } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/fotos/evento/:id (público)
router.get('/evento/:id', listarFotosEvento);

// GET /api/fotos/mis-fotos (requiere login)
router.get('/mis-fotos', verificarToken, listarMisFotos);

// POST /api/fotos (solo admin) — registra UNA foto ya subida
router.post('/', verificarToken, soloAdmin, subirFoto);

// POST /api/fotos/multiple (solo admin) — registra VARIAS fotos ya subidas
router.post('/multiple', verificarToken, soloAdmin, subirFotosMultiple);

// PUT /api/fotos/:id/portada (solo admin) — usar esta foto como portada del evento
router.put('/:id/portada', verificarToken, soloAdmin, usarComoPortada);

// DELETE /api/fotos/:id (solo admin)
router.delete('/:id', verificarToken, soloAdmin, eliminarFoto);

export default router;