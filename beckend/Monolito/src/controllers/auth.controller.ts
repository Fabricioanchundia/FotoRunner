import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { responderExito, responderError } from '../utils/response';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Schemas de validación
const schemaRegistro = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  phone: z.string().optional()
});

const schemaLogin = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida')
});

const generarToken = (id: string, email: string, role: string): string => {
  const secret = process.env.JWT_SECRET!;
  return jwt.sign({ id, email, role }, secret, {
    expiresIn: '24h'
  });
};

export const registro = async (req: Request, res: Response): Promise<void> => {
  try {
    const datos = schemaRegistro.safeParse(req.body);
    if (!datos.success) {
      responderError(res, 'Datos inválidos', 400, datos.error.issues);
      return;
    }

    const { nombre, email, password, phone } = datos.data;

    // Verificar si el email ya existe
    const usuarioExistente = await prisma.user.findUnique({
      where: { email }
    });

    if (usuarioExistente) {
      responderError(res, 'El email ya está registrado', 409);
      return;
    }

    // Cifrar contraseña
    const passwordHash = await bcrypt.hash(password, 12);

    // Crear usuario
    const usuario = await prisma.user.create({
      data: {
        nombre,
        email,
        password: passwordHash,
        phone: phone ?? null
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        phone: true,
        role: true,
        created_at: true
      }
    });

    const token = generarToken(usuario.id, usuario.email, usuario.role);

    logger.info(`Nuevo usuario registrado: ${email}`);
    responderExito(res, { usuario, token }, 'Usuario registrado exitosamente', 201);
  } catch (error) {
    logger.error(`Error en registro: ${error}`);
    responderError(res, 'Error al registrar usuario', 500);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const datos = schemaLogin.safeParse(req.body);
    if (!datos.success) {
      responderError(res, 'Datos inválidos', 400, datos.error.issues);
      return;
    }

    const { email, password } = datos.data;

    // Buscar usuario
    const usuario = await prisma.user.findUnique({
      where: { email }
    });

    if (!usuario) {
      responderError(res, 'Credenciales incorrectas', 401);
      return;
    }

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      responderError(res, 'Credenciales incorrectas', 401);
      return;
    }

    const token = generarToken(usuario.id, usuario.email, usuario.role);

    logger.info(`Login exitoso: ${email}`);
    responderExito(res, {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        role: usuario.role
      }
    }, 'Login exitoso');
  } catch (error) {
    logger.error(`Error en login: ${error}`);
    responderError(res, 'Error al iniciar sesión', 500);
  }
};

export const perfil = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioReq = (req as Request & { usuario?: { id: string } }).usuario;

    const usuario = await prisma.user.findUnique({
      where: { id: usuarioReq?.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        phone: true,
        role: true,
        avatar_url: true,
        email_verified: true,
        phone_verified: true,
        created_at: true
      }
    });

    if (!usuario) {
      responderError(res, 'Usuario no encontrado', 404);
      return;
    }

    responderExito(res, usuario, 'Perfil obtenido exitosamente');
  } catch (error) {
    logger.error(`Error al obtener perfil: ${error}`);
    responderError(res, 'Error al obtener perfil', 500);
  }
};