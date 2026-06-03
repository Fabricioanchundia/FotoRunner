import { Router } from 'express';
import { registro, login, perfil } from '../controllers/auth.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/auth/registro
router.post('/registro', registro);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/perfil (protegida)
router.get('/perfil', verificarToken, perfil);

export default router;