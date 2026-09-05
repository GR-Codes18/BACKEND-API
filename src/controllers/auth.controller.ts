import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../config/db';
import { registerSchema } from '../schemas/auth.schema';
import { createOtpForUser } from '../services/otp.service';
import jwt from 'jsonwebtoken';
import { verifyOtpSchema } from '../schemas/auth.schema';
import { validateOtp } from '../services/otp.service';
import { loginSchema } from '../schemas/auth.schema';
import { resendOtpSchema } from '../schemas/auth.schema';
import { canResendOtp } from '../services/otp.service';

const SALT_ROUNDS = 10;

export async function register(req: Request, res: Response) {
  // 1. Validar el body con zod
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Datos inválidos',
      errors: z.treeifyError(result.error),
    });
  }

  const { name, email, password } = result.data;

  try {
    // 2. Verificar si el correo ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser && existingUser.isVerified) {
      return res.status(409).json({
        message: 'Este correo ya está registrado. Inicia sesión.',
      });
    }

    // 3. Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    let user;

    if (existingUser && !existingUser.isVerified) {
      // Usuario existe pero no verificado: actualizamos sus datos
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: { name, password: hashedPassword },
      });
    } else {
      // Usuario nuevo
      user = await prisma.user.create({
        data: { name, email, password: hashedPassword },
      });
    }

    // 4. Generar y enviar OTP
    await createOtpForUser(user.id, user.email);

    // 5. Responder (sin JWT todavía, falta verificar el OTP)
    return res.status(201).json({
      message: 'Registro exitoso. Revisa tu correo para verificar tu cuenta.',
      userId: user.id,
    });
  } catch (error) {
    console.error('Error en register:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function verifyOtp(req: Request, res: Response) {
  const result = verifyOtpSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Datos inválidos',
      errors: z.treeifyError(result.error),
    });
  }

  const { userId, code } = result.data;

  try {
    const isValid = await validateOtp(userId, code);

    if (!isValid) {
      return res.status(400).json({
        message: 'Código inválido o expirado. Solicita uno nuevo.',
      });
    }

    // Marcar el usuario como verificado
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    // Generar el JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN as string } as jwt.SignOptions
    );

    return res.status(200).json({
      message: 'Cuenta verificada exitosamente',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error en verifyOtp:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function login(req: Request, res: Response) {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Datos inválidos',
      errors: z.treeifyError(result.error),
    });
  }

  const { email, password } = result.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Tu cuenta no está verificada. Completa el registro primero.',
      });
    }

    // Contraseña correcta y cuenta verificada: generar OTP para el 2FA
    await createOtpForUser(user.id, user.email);

    return res.status(200).json({
      message: 'Código de verificación enviado a tu correo',
      userId: user.id,
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function resendOtp(req: Request, res: Response) {
  const result = resendOtpSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Datos inválidos',
      errors: z.treeifyError(result.error),
    });
  }

  const { userId } = result.data;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const { allowed, waitSeconds } = await canResendOtp(userId);

    if (!allowed) {
      return res.status(429).json({
        message: `Debes esperar ${waitSeconds} segundos antes de solicitar un nuevo código`,
      });
    }

    await createOtpForUser(user.id, user.email);

    return res.status(200).json({
      message: 'Nuevo código enviado a tu correo',
    });
  } catch (error) {
    console.error('Error en resendOtp:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function me(req: Request, res: Response) {
  // req.user ya viene garantizado por el middleware — si llegamos aquí, el token era válido
  return res.status(200).json({
    userId: req.user?.userId,
    email: req.user?.email,
  });
}