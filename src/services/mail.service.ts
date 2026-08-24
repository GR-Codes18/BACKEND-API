import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: `Big Data System <notificaciones@bigdata-crm.com>`,
    to,
    subject: 'Tu código de verificación',
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Código de verificación</h2>
        <p>Tu código es:</p>
        <h1 style="letter-spacing: 4px;">${code}</h1>
        <p>Este código expira en 3 minutos.</p>
      </div>
    `,
  });

  if (error) {
    console.error('Error al enviar correo con Resend:', error);
    throw new Error('No se pudo enviar el correo de verificación');
  }
}