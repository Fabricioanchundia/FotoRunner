import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import facialRoutes from './routes/facial.routes';

dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3002;

// Evita que el header 'X-Powered-By: Express' revele el framework/versión.
app.disable('x-powered-by');

// ms-facial solo lo consume el Monolito server-to-server (confirmado: el
// frontend nunca lo llama directo desde el navegador), así que no necesita
// aceptar peticiones CORS de cualquier origen. Se restringe a los orígenes
// configurados explícitamente; vacío por defecto = ningún navegador puede
// llamarlo directo.
const origenesPermitidos = (process.env['CORS_ORIGINS'] || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({ origin: origenesPermitidos.length > 0 ? origenesPermitidos : false }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', servicio: 'ms-facial', version: '1.0.0' });
});

app.use('/api/facial', facialRoutes);

app.listen(PORT, () => {
  console.log(`MS-Facial corriendo en puerto ${PORT}`);
});