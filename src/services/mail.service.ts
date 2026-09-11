import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: `Mercamax <notificaciones@bigdata-crm.com>`,
    to,
    subject: 'Tu código de verificación',
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Código de verificación</h2>
        <p>Tu código es:</p>
        <h1 style="letter-spacing: 4px;">${code}</h1>
        <p>Este código expira en 1 minuto.</p>
      </div>
    `,
  });

  if (error) {
    console.error('Error al enviar correo con Resend:', error);
    throw new Error('No se pudo enviar el correo de verificación');
  }
}

export async function sendLoginRequestEmail(
  to: string,
  trabajadorNombre: string,
  trabajadorEmail: string,
  aceptarUrl: string,
  rechazarUrl: string
): Promise<void> {
  const { error } = await resend.emails.send({
    from: `Mercamax <notificaciones@bigdata-crm.com>`,
    to,
    subject: 'Solicitud de acceso pendiente',
    html: `
      <div style="font-family: sans-serif; padding: 20px; max-width: 480px;">
        <h2>Solicitud de acceso</h2>
        <p><strong>${trabajadorNombre}</strong> (${trabajadorEmail}) quiere ingresar al sistema.</p>
        <p>¿Autorizas el acceso?</p>
        <div style="margin: 24px 0;">
          <a href="${aceptarUrl}" style="background-color: #16a34a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 12px; display: inline-block;">Aceptar</a>
          <a href="${rechazarUrl}" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Rechazar</a>
        </div>
        <p style="color: #6b7280; font-size: 13px;">Esta solicitud expira en ${process.env.LOGIN_REQUEST_EXPIRATION_MINUTES || 10} minutos.</p>
      </div>
    `,
  });

  if (error) {
    console.error('Error al enviar correo de solicitud de acceso:', error);
    throw new Error('No se pudo enviar el correo de solicitud de acceso');
  }
}

export async function sendAdminContactEmail(
  adminEmail: string,
  userName: string,
  userEmail: string,
  userMessage: string
): Promise<void> {
  const { error } = await resend.emails.send({
    from: `Mercamax <notificaciones@bigdata-crm.com>`,
    to: adminEmail,
    subject: 'Nuevo mensaje de usuario',
    html: `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px;">
        <h2>Nuevo mensaje de usuario</h2>
        <p><strong>Nombre:</strong> ${userName}</p>
        <p><strong>Correo:</strong> ${userEmail}</p>
        <p><strong>Mensaje:</strong></p>
        <div style="border-left:4px solid #e5e7eb; padding:12px; margin:12px 0; white-space:pre-wrap;">${userMessage}</div>
        <p style="color: #6b7280; font-size: 13px;">Este mensaje fue enviado desde el formulario de contacto del usuario.</p>
      </div>
    `,
  });

  if (error) {
    console.error('Error al enviar correo al administrador:', error);
    throw new Error('No se pudo enviar el correo al administrador');
  }
}