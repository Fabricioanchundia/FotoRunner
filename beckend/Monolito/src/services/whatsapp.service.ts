import twilio from 'twilio';
import logger from '../utils/logger';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const NUMERO_WHATSAPP = process.env.TWILIO_WHATSAPP_NUMBER ?? 'whatsapp:+14155238886';

export const enviarWhatsAppCompra = async (
  telefono: string,
  nombre: string,
  eventoNombre: string,
  linkDescarga: string
): Promise<void> => {
  try {
    await client.messages.create({
      from: NUMERO_WHATSAPP,
      to: `whatsapp:${telefono}`,
      body: `¡Hola ${nombre}! 🏃 Tus fotos de *${eventoNombre}* están listas.\n\nDescárgalas aquí: ${linkDescarga}\n\n_Este enlace expira en 1 hora._`
    });

    logger.info(`WhatsApp de compra enviado a: ${telefono}`);
  } catch (error) {
    logger.error(`Error al enviar WhatsApp de compra: ${error}`);
    throw new Error('Error al enviar WhatsApp');
  }
};

export const enviarWhatsAppPreview = async (
  telefono: string,
  nombre: string,
  eventoNombre: string,
  linkEvento: string
): Promise<void> => {
  try {
    await client.messages.create({
      from: NUMERO_WHATSAPP,
      to: `whatsapp:${telefono}`,
      body: `¡Hola ${nombre}! 📸 Apareces en fotos de *${eventoNombre}*.\n\nVe a verlas aquí: ${linkEvento}`
    });

    logger.info(`WhatsApp de preview enviado a: ${telefono}`);
  } catch (error) {
    logger.error(`Error al enviar WhatsApp de preview: ${error}`);
    throw new Error('Error al enviar WhatsApp');
  }
};