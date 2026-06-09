import { Router } from 'express';
import { registrar, login, perfil, verificarCodigo, reenviarCodigo } from '../controllers/auth.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/registro', registrar);
router.post('/login', login);
router.post('/verificar-codigo', verificarCodigo);
router.post('/reenviar-codigo', reenviarCodigo);
router.get('/perfil', verificarToken, perfil);
router.post('/verificar-codigo', verificarCodigo);
router.post('/reenviar-codigo', reenviarCodigo);

export default router;