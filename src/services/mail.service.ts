import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  await transporter.sendMail({
    from: `"Big Data System" <${process.env.EMAIL_USER}>`,
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
}