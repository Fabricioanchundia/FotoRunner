import { Router } from 'express';
import {
  registrarVector,
  procesarFoto,
  procesarEvento,
  buscarFotos,
  health
} from '../controllers/facial.controller';

const router = Router();

router.get('/health', health);
router.post('/registrar-vector', registrarVector);
router.post('/procesar-foto', procesarFoto);
router.post('/procesar-evento', procesarEvento);
router.get('/buscar/:userId', buscarFotos);

export default router;