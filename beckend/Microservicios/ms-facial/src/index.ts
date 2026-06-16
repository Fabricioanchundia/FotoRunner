import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import facialRoutes from './routes/facial.routes';

dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3002;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', servicio: 'ms-facial', version: '1.0.0' });
});

app.use('/api/facial', facialRoutes);

app.listen(PORT, () => {
  console.log(`MS-Facial corriendo en puerto ${PORT}`);
});