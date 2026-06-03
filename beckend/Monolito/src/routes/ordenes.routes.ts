import { Router } from 'express';
import {
  listarMisOrdenes,
  obtenerOrden,
  crearOrden
} from '../controllers/ordenes.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/ordenes (mis órdenes)
router.get('/', verificarToken, listarMisOrdenes);

// GET /api/ordenes/:id
router.get('/:id', verificarToken, obtenerOrden);

// POST /api/ordenes
router.post('/', verificarToken, crearOrden);

export default router;