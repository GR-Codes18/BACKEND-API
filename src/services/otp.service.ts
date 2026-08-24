import { prisma } from '../config/db';
import { sendOtpEmail } from './mail.service';

const OTP_EXPIRATION_MINUTES = 3;

// Genera un código de 6 dígitos
function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Crea un nuevo OTP para un usuario y lo guarda en la BD
export async function createOtpForUser(userId: string, email: string): Promise<void> {
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: {
      code,
      expiresAt,
      userId,
    },
  });

  await sendOtpEmail(email, code);

  // Log de respaldo para desarrollo (ver que se generó correctamente)
  console.log(`✅ OTP generado y enviado a ${email}`);
}

// Valida un código OTP para un usuario específico
export async function validateOtp(userId: string, code: string): Promise<boolean> {
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      userId,
      code,
      used: false,
      expiresAt: { gt: new Date() }, // gt = greater than (mayor que ahora)
    },
  });

  if (!otpRecord) {
    return false;
  }

  // Marca el código como usado para que no se pueda reusar
  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { used: true },
  });

  return true;
}

const RESEND_COOLDOWN_MINUTES = 10;

// Verifica si el usuario puede solicitar un nuevo OTP (cooldown de 10 min)
export async function canResendOtp(userId: string): Promise<{ allowed: boolean; waitSeconds?: number }> {
  const lastOtp = await prisma.otpCode.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (!lastOtp) {
    return { allowed: true };
  }

  const cooldownEnds = new Date(lastOtp.createdAt.getTime() + RESEND_COOLDOWN_MINUTES * 60 * 1000);
  const now = new Date();

  if (now < cooldownEnds) {
    const waitSeconds = Math.ceil((cooldownEnds.getTime() - now.getTime()) / 1000);
    return { allowed: false, waitSeconds };
  }

  return { allowed: true };
}