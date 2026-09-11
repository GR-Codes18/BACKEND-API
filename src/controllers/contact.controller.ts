import { Request, Response } from 'express';
import { sendAdminContactEmail } from '../services/mail.service';

export async function contactController(req: Request, res: Response) {
  const { name, email, message } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL || 'analistabigdata2@gmail.com';

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, msg: 'Faltan datos requeridos' });
  }

  try {
    await sendAdminContactEmail(adminEmail, name, email, message);
    return res.status(200).json({ ok: true, msg: 'Mensaje enviado al administrador' });
  } catch (err) {
    console.error('contactController error:', err);
    return res.status(500).json({ ok: false, msg: 'Error al enviar el correo' });
  }
}
