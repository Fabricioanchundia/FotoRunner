import { Request, Response } from 'express';
import {
  registrarVectorUsuario,
  procesarFotoEvento,
  procesarFotosEvento,
  buscarFotosUsuario
} from '../services/matcher.service';

const responderExito = (res: Response, datos: any, mensaje: string) => {
  res.json({ exito: true, datos, mensaje });
};

const responderError = (res: Response, mensaje: string, codigo: number = 400) => {
  res.status(codigo).json({ exito: false, mensaje });
};

// POST /api/facial/registrar-vector
export const registrarVector = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, avatar_url } = req.body;
    if (!user_id || !avatar_url) {
      responderError(res, 'user_id y avatar_url son requeridos');
      return;
    }

    const resultado = await registrarVectorUsuario(user_id, avatar_url);

    if (resultado.success) {
      responderExito(res, null, resultado.mensaje);
    } else {
      responderError(res, resultado.mensaje);
    }
  } catch (error) {
    responderError(res, `Error interno: ${error}`, 500);
  }
};

// POST /api/facial/procesar-foto
export const procesarFoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { photo_id, photo_url } = req.body;
    if (!photo_id || !photo_url) {
      responderError(res, 'photo_id y photo_url son requeridos');
      return;
    }

    const resultado = await procesarFotoEvento(photo_id, photo_url);
    responderExito(res, resultado, `Foto procesada: ${resultado.matches} matches encontrados`);
  } catch (error) {
    responderError(res, `Error interno: ${error}`, 500);
  }
};

// POST /api/facial/procesar-evento
export const procesarEvento = async (req: Request, res: Response): Promise<void> => {
  try {
    const { event_id } = req.body;
    if (!event_id) {
      responderError(res, 'event_id es requerido');
      return;
    }

    // Procesar en background
    res.json({ exito: true, mensaje: 'Procesamiento iniciado en background', datos: { event_id } });

    // Ejecutar después de responder
    procesarFotosEvento(event_id).then(resultado => {
      console.log(`Evento ${event_id} procesado:`, resultado);
    });
  } catch (error) {
    responderError(res, `Error interno: ${error}`, 500);
  }
};

// GET /api/facial/buscar/:userId
export const buscarFotos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { event_id } = req.query;

    if (!userId) {
      responderError(res, 'userId es requerido');
      return;
    }

    const fotos = await buscarFotosUsuario(userId, event_id as string);
    responderExito(res, fotos, `${fotos.length} fotos encontradas`);
  } catch (error) {
    responderError(res, `Error interno: ${error}`, 500);
  }
};

// GET /api/facial/health
export const health = (_req: Request, res: Response): void => {
  res.json({ exito: true, mensaje: 'MS-Facial funcionando', timestamp: new Date() });
};