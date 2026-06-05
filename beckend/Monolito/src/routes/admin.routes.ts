import { Router } from 'express';
import { verificarToken, soloAdmin } from '../middlewares/auth.middleware';
import {
  obtenerStats, listarUsuarios, listarTodasFotos,
  eliminarFotoAdmin, cambiarRolUsuario, cambiarStatusEvento
} from '../controllers/admin.controller';

const router = Router();

router.use(verificarToken, soloAdmin);

router.get('/stats', obtenerStats);
router.get('/usuarios', listarUsuarios);
router.get('/fotos', listarTodasFotos);
router.delete('/fotos/:id', eliminarFotoAdmin);
router.patch('/usuarios/:id/rol', cambiarRolUsuario);
router.patch('/eventos/:id/status', cambiarStatusEvento);

export default router;