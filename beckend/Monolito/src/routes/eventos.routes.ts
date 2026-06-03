import { Router } from 'express';
import {
  listarEventos,
  obtenerEvento,
  crearEvento,
  actualizarEvento
} from '../controllers/eventos.controller';
import { verificarToken, soloAdmin } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/eventos (público)
router.get('/', listarEventos);

// GET /api/eventos/:id (público)
router.get('/:id', obtenerEvento);

// POST /api/eventos (solo admin)
router.post('/', verificarToken, soloAdmin, crearEvento);

// PUT /api/eventos/:id (solo admin)
router.put('/:id', verificarToken, soloAdmin, actualizarEvento);

export default router;