import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { responderExito, responderError } from '../utils/response';
import logger from '../utils/logger';
import { RequestAutenticado } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

const codigosVerificacion = new Map<string, {
  codigo: string;
  expires: Date;
  userId: string;
}>();

const generarCodigo = () => Math.floor(100000 + Math.random() * 900000).toString();

export const registrar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, email, phone, password } = req.body;

    const emailExiste = await prisma.user.findUnique({ where: { email } });
    if (emailExiste) {
      responderError(res, 'Este correo ya está registrado', 400);
      return;
    }

    if (phone) {
      const phoneExiste = await prisma.user.findFirst({ where: { phone } });
      if (phoneExiste) {
        responderError(res, 'Este teléfono ya está registrado', 400);
        return;
      }
    }

    const hash = await bcrypt.hash(password, 10);
    const usuario = await prisma.user.create({
      data: {
        nombre,
        email,
        phone: phone || null,
        password: hash,
        role: 'USER'
      }
    });

    const codigo = generarCodigo();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    codigosVerificacion.set(email, { codigo, expires, userId: usuario.id });

    logger.info(`[VERIFICACION] Código para ${email}: ${codigo}`);

    const token = jwt.sign(
      { id: usuario.id, role: usuario.role },
      process.env['JWT_SECRET'] || 'secret',
      { expiresIn: '7d' }
    );

    responderExito(res, {
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, role: usuario.role },
      verificacionPendiente: true,
      codigoDesarrollo: process.env['NODE_ENV'] === 'production' ? undefined : codigo
    }, 'Usuario registrado. Verifica tu correo.');
  } catch (error) {
    logger.error(`Error registro: ${error}`);
    responderError(res, 'Error al registrar usuario', 500);
  }
};

export const verificarCodigo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, codigo } = req.body;

    const verificacion = codigosVerificacion.get(email);

    if (!verificacion) {
      responderError(res, 'Código expirado o inválido. Solicita uno nuevo.', 400);
      return;
    }

    if (verificacion.expires < new Date()) {
      codigosVerificacion.delete(email);
      responderError(res, 'El código ha expirado. Solicita uno nuevo.', 400);
      return;
    }

    if (verificacion.codigo !== String(codigo)) {
      responderError(res, 'Código incorrecto', 400);
      return;
    }

    await prisma.user.update({
      where: { id: verificacion.userId },
      data: { email_verified: true }
    });

    codigosVerificacion.delete(email);
    responderExito(res, null, 'Correo verificado correctamente');
  } catch (error) {
    logger.error(`Error verificación: ${error}`);
    responderError(res, 'Error al verificar código', 500);
  }
};

export const reenviarCodigo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const usuario = await prisma.user.findUnique({ where: { email } });
    if (!usuario) {
      responderError(res, 'Usuario no encontrado', 404);
      return;
    }

    const codigo = generarCodigo();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    codigosVerificacion.set(email, { codigo, expires, userId: usuario.id });

    logger.info(`[VERIFICACION] Nuevo código para ${email}: ${codigo}`);

    responderExito(res, {
      codigoDesarrollo: process.env['NODE_ENV'] === 'production' ? undefined : codigo
    }, 'Código reenviado');
  } catch (error) {
    logger.error(`Error reenvío: ${error}`);
    responderError(res, 'Error al reenviar código', 500);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const usuario = await prisma.user.findUnique({ where: { email } });
    if (!usuario || !await bcrypt.compare(password, usuario.password)) {
      responderError(res, 'Credenciales incorrectas', 401);
      return;
    }

    const token = jwt.sign(
      { id: usuario.id, role: usuario.role },
      process.env['JWT_SECRET'] || 'secret',
      { expiresIn: '7d' }
    );

    responderExito(res, {
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, role: usuario.role }
    }, 'Login exitoso');
  } catch (error) {
    logger.error(`Error login: ${error}`);
    responderError(res, 'Error al iniciar sesión', 500);
  }
};

export const perfil = async (req: RequestAutenticado, res: Response): Promise<void> => {
  try {
    const usuario = await prisma.user.findUnique({
      where: { id: req.usuario?.id },
      select: {
        id: true, nombre: true, email: true, phone: true,
        role: true, avatar_url: true, email_verified: true, created_at: true
      }
    });
    if (!usuario) { responderError(res, 'Usuario no encontrado', 404); return; }
    responderExito(res, usuario, 'Perfil obtenido');
  } catch (error) {
    logger.error(`Error perfil: ${error}`);
    responderError(res, 'Error al obtener perfil', 500);
  }
};