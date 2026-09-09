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
import {
  crearOReusarLoginRequest,
  aceptarLoginRequest,
  rechazarLoginRequest,
  consultarEstado,
} from '../services/loginRequest.service';

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
    // 2. Solo puede existir un Analista en el sistema
    const analistaExistente  = await prisma.user.count({ where: { role: 'ANALISTA' } });

    if (analistaExistente > 0) {
      return res.status(403).json({
        message: 'Ya existe un Analista registrado. Este endpoint no está disponible.',
      });
    }

    // 3. Verificar si el correo ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(409).json({
        message: 'Este correo ya está registrado.',
      });
    }

    // 4. Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 5. Crear el Analista
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: 'ANALISTA' },
    });

    // 6. Generar y enviar OTP
    await createOtpForUser(user.id, user.email);

    // 7. Responder (sin JWT todavía, falta verificar el OTP)
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

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Generar el JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
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
        role: user.role,
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

    if (user.role === 'TRABAJADOR') {
      const solicitud = await crearOReusarLoginRequest(user.id);

      return res.status(202).json({
        message: 'Tu solicitud de acceso fue enviada. Espera la aprobación del Analista.',
        loginRequestId: solicitud.id,
        email: user.email,
      });
    }

    // Analista: comportamiento original, directo a OTP
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
    role: req.user?.role,
  });
}

export async function crearTrabajador(req: Request, res: Response) {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Datos inválidos',
      errors: z.treeifyError(result.error),
    });
  }

  const { name, email, password } = result.data;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(409).json({
        message: 'Este correo ya está registrado.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const trabajador = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: 'TRABAJADOR' },
    });

    return res.status(201).json({
      message: 'Trabajador creado exitosamente',
      trabajador: {
        id: trabajador.id,
        name: trabajador.name,
        email: trabajador.email,
        role: trabajador.role,
        passwordInicial: password,
      },
    });
  } catch (error) {
    console.error('Error en crearTrabajador:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function aceptarSolicitud(req: Request, res: Response) {
  const id = req.params.id as string;

  try {
    const resultado = await aceptarLoginRequest(id);

    if (!resultado.ok) {
      const html = paginaResultado(
        resultado.motivo === 'expirada'
          ? 'Esta solicitud ya expiró.'
          : resultado.motivo === 'no_pendiente'
          ? `Esta solicitud ya fue ${resultado.estadoActual === 'ACEPTADA' ? 'aceptada' : 'resuelta'} antes.`
          : 'Solicitud no encontrada.'
      );
      return res.status(200).send(html);
    }

    return res.status(200).send(paginaResultado('Acceso aceptado. Se envió el código al Trabajador.'));
  } catch (error) {
    console.error('Error en aceptarSolicitud:', error);
    return res.status(500).send(paginaResultado('Ocurrió un error al procesar la solicitud.'));
  }
}

export async function rechazarSolicitud(req: Request, res: Response) {
  const id = req.params.id as string;

  try {
    const resultado = await rechazarLoginRequest(id);

    if (!resultado.ok) {
      const html = paginaResultado(
        resultado.motivo === 'no_pendiente'
          ? `Esta solicitud ya fue ${resultado.estadoActual === 'RECHAZADA' ? 'rechazada' : 'resuelta'} antes.`
          : 'Solicitud no encontrada.'
      );
      return res.status(200).send(html);
    }

    return res.status(200).send(paginaResultado('Acceso rechazado correctamente.'));
  } catch (error) {
    console.error('Error en rechazarSolicitud:', error);
    return res.status(500).send(paginaResultado('Ocurrió un error al procesar la solicitud.'));
  }
}

export async function estadoSolicitud(req: Request, res: Response) {
  const id = req.params.id as string;
  const { email } = req.query;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ message: 'El email es requerido' });
  }

  try {
    const estado = await consultarEstado(id, email);

    if (!estado) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    return res.status(200).json({ estado });
  } catch (error) {
    console.error('Error en estadoSolicitud:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

function paginaResultado(mensaje: string): string {
  return `
    <div style="font-family: sans-serif; padding: 40px; text-align: center;">
      <h2>${mensaje}</h2>
      <p style="color: #6b7280;">Ya puedes cerrar esta pestaña.</p>
    </div>
  `;
}