import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Rutas
import authRoutes from './routes/auth.routes';
import usuariosRoutes from './routes/usuarios.routes';
import eventosRoutes from './routes/eventos.routes';
import fotosRoutes from './routes/fotos.routes';
import ordenesRoutes from './routes/ordenes.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting general: 100 req/min
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas peticiones desde esta IP'
}));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/fotos', fotosRoutes);
app.use('/api/ordenes', ordenesRoutes);

// Ruta de salud
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', servicio: 'fotorunner-monolito' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

export default app;