import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import facialRoutes from './routes/facial.routes';
import { verificarLlaveInterna } from './middlewares/internalAuth.middleware';

dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3002;

// Oculta la cabecera "X-Powered-By: Express" — no aporta nada al cliente
// y le da información gratis a quien quiera enumerar tecnologías del stack.
app.disable('x-powered-by');

// ms-facial solo lo llama el Monolito, nunca un navegador directamente —
// no hay ningún origen de frontend legítimo que necesite golpear este
// puerto. Restringimos a la URL del Monolito en vez de aceptar cualquier
// origen (cors() sin argumentos acepta todos).
app.use(cors({
  origin: process.env['FRONTEND_URL'] ?? 'http://localhost:3000'
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', servicio: 'ms-facial', version: '1.0.0' });
});

// Toda /api/facial requiere la llave interna compartida con el Monolito.
// /health queda fuera a propósito, para que el health check del hosting
// siga funcionando sin necesitar la llave.
app.use('/api/facial', verificarLlaveInterna, facialRoutes);

app.listen(PORT, () => {
  console.log(`MS-Facial corriendo en puerto ${PORT}`);
});