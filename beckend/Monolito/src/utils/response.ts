import { Response } from 'express';

export const responderExito = (
  res: Response,
  datos: unknown,
  mensaje = 'Operación exitosa',
  codigo = 200
) => {
  return res.status(codigo).json({
    exito: true,
    mensaje,
    datos
  });
};

export const responderError = (
  res: Response,
  mensaje = 'Error interno del servidor',
  codigo = 500,
  errores?: unknown
) => {
  return res.status(codigo).json({
    exito: false,
    mensaje,
    errores: errores || null
  });
};