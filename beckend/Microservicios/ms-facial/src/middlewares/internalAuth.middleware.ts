import { Request, Response, NextFunction } from 'express';

// ms-facial NO tiene autenticación de usuario final — solo lo debe llamar
// el Monolito, server-to-server. Esta llave compartida (configurada por
// variable de entorno en AMBOS servicios) evita que cualquiera que llegue
// a este puerto pueda:
//   - leer las fotos de otro usuario por GET /buscar/:userId
//   - pisar el vector facial de otro usuario por POST /registrar-vector
//   - gastar cuota de Google Cloud Vision por POST /procesar-foto|evento
//
// Importante: si INTERNAL_API_KEY no está configurada, el middleware
// bloquea por completo (falla cerrado) en vez de permitir el acceso por accidente.
const INTERNAL_API_KEY = process.env['INTERNAL_API_KEY'];

export const verificarLlaveInterna = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!INTERNAL_API_KEY) {
    console.error('INTERNAL_API_KEY no está configurada en ms-facial — bloqueando todas las peticiones.');
    res.status(500).json({ exito: false, mensaje: 'Servicio mal configurado' });
    return;
  }

  const llaveRecibida = req.header('x-internal-api-key');

  if (llaveRecibida !== INTERNAL_API_KEY) {
    res.status(401).json({ exito: false, mensaje: 'No autorizado' });
    return;
  }

  next();
};