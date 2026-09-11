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

export async function sendSolicitudAlertEmail(
  to: string,
  solicitud: {
    nombreCompleto: string;
    correo: string;
    telefono: string;
    mensaje: string;
  }
): Promise<void> {
  const { error } = await resend.emails.send({
    from: `Mercamax <notificaciones@bigdata-crm.com>`,
    to,
    subject: 'Nueva solicitud de contacto',
    html: `
      <div style="font-family: sans-serif; padding: 20px; max-width: 480px;">
        <h2>Nueva solicitud de contacto</h2>
        <p>Tienes una nueva oportunidad de negocio:</p>
        <p><strong>Nombre:</strong> ${solicitud.nombreCompleto}</p>
        <p><strong>Correo:</strong> ${solicitud.correo}</p>
        <p><strong>Teléfono:</strong> ${solicitud.telefono}</p>
        <p><strong>Mensaje:</strong></p>
        <p style="background-color: #f3f4f6; padding: 12px; border-radius: 6px;">${solicitud.mensaje}</p>
        <p style="color: #6b7280; font-size: 13px;">Revisa el módulo Solicitudes para responder.</p>
      </div>
    `,
  });

  if (error) {
    console.error('Error al enviar correo de alerta de solicitud:', error);
    throw new Error('No se pudo enviar el correo de alerta al analista');
  }
}

export async function sendSolicitudRespuestaEmail(
  to: string,
  nombreCompleto: string,
  respuesta: string
): Promise<void> {
  const { error } = await resend.emails.send({
    from: `Mercamax <notificaciones@bigdata-crm.com>`,
    to,
    subject: 'Respuesta a tu solicitud',
    html: `
      <div style="font-family: sans-serif; padding: 20px; max-width: 480px;">
        <h2>Hola, ${nombreCompleto}</h2>
        <p>Gracias por contactarte con Mercamax. Esta es nuestra respuesta a tu mensaje:</p>
        <p style="background-color: #f3f4f6; padding: 12px; border-radius: 6px;">${respuesta}</p>
      </div>
    `,
  });

  if (error) {
    console.error('Error al enviar correo de respuesta al cliente:', error);
    throw new Error('No se pudo enviar el correo de respuesta al cliente');
  }
}