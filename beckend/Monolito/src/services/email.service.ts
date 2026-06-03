import { Resend } from 'resend';
import logger from '../utils/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

export const enviarEmailCompra = async (
  email: string,
  nombre: string,
  eventoNombre: string,
  linkDescarga: string
): Promise<void> => {
  try {
    await resend.emails.send({
      from: 'FotoRunner <noreply@fotorunner.ec>',
      to: email,
      subject: `¡Tus fotos de ${eventoNombre} están listas!`,
      html: `
        <h1>¡Hola ${nombre}!</h1>
        <p>Tus fotos del evento <strong>${eventoNombre}</strong> están listas para descargar.</p>
        <a href="${linkDescarga}" style="
          background: #FF6B00;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
        ">
          Descargar mis fotos
        </a>
        <p style="color: #666; font-size: 12px;">
          Este enlace expira en 1 hora.
        </p>
      `
    });

    logger.info(`Email de compra enviado a: ${email}`);
  } catch (error) {
    logger.error(`Error al enviar email de compra: ${error}`);
    throw new Error('Error al enviar email');
  }
};

export const enviarEmailPreview = async (
  email: string,
  nombre: string,
  eventoNombre: string,
  linkEvento: string
): Promise<void> => {
  try {
    await resend.emails.send({
      from: 'FotoRunner <noreply@fotorunner.ec>',
      to: email,
      subject: `¡Apareces en fotos de ${eventoNombre}!`,
      html: `
        <h1>¡Hola ${nombre}!</h1>
        <p>Te encontramos en fotos del evento <strong>${eventoNombre}</strong>.</p>
        <p>Visita nuestra plataforma para verlas y adquirirlas.</p>
        <a href="${linkEvento}" style="
          background: #FF6B00;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
        ">
          Ver mis fotos
        </a>
      `
    });

    logger.info(`Email de preview enviado a: ${email}`);
  } catch (error) {
    logger.error(`Error al enviar email de preview: ${error}`);
    throw new Error('Error al enviar email');
  }
};