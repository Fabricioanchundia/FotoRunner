import { Router } from 'express';
import { obtenerUsuario, actualizarUsuario } from '../controllers/usuarios.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/usuarios/:id
router.get('/:id', verificarToken, obtenerUsuario);

// PUT /api/usuarios/:id
router.put('/:id', verificarToken, actualizarUsuario);

export default router;