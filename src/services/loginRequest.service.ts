import { prisma } from '../config/db';
import { createOtpForUser } from './otp.service';
import { sendLoginRequestEmail } from './mail.service';

const EXPIRATION_MINUTES = 10;

// Email del único Analista del sistema — se obtiene dinámicamente, no hardcodeado
async function getAnalistaEmail(): Promise<string | null> {
  const analista = await prisma.user.findFirst({ where: { role: 'ANALISTA' } });
  return analista?.email ?? null;
}

function estaExpirada(createdAt: Date): boolean {
  const minutosTranscurridos = (Date.now() - createdAt.getTime()) / 1000 / 60;
  return minutosTranscurridos > EXPIRATION_MINUTES;
}

export async function crearOReusarLoginRequest(userId: string) {
  const pendiente = await prisma.loginRequest.findFirst({
    where: { userId, estado: 'PENDIENTE' },
    orderBy: { createdAt: 'desc' },
  });

  if (pendiente) {
    if (!estaExpirada(pendiente.createdAt)) {
      // Aún vigente: se reusa, no se crea otra ni se reenvía correo
      return pendiente;
    }

    // Expiró: se marca y se crea una nueva más abajo
    await prisma.loginRequest.update({
      where: { id: pendiente.id },
      data: { estado: 'EXPIRADA', resueltaAt: new Date() },
    });
  }

  const nuevaSolicitud = await prisma.loginRequest.create({
    data: { userId },
  });

  const trabajador = await prisma.user.findUnique({ where: { id: userId } });
  const analistaEmail = await getAnalistaEmail();

  if (!trabajador || !analistaEmail) {
    throw new Error('No se pudo procesar la solicitud de acceso');
  }

  const backendUrl = process.env.BACKEND_URL;
  const aceptarUrl = `${backendUrl}/auth/login-requests/${nuevaSolicitud.id}/aceptar`;
  const rechazarUrl = `${backendUrl}/auth/login-requests/${nuevaSolicitud.id}/rechazar`;

  await sendLoginRequestEmail(
    analistaEmail,
    trabajador.name,
    trabajador.email,
    aceptarUrl,
    rechazarUrl
  );

  return nuevaSolicitud;
}

export async function aceptarLoginRequest(id: string) {
  const solicitud = await prisma.loginRequest.findUnique({ where: { id } });

  if (!solicitud) return { ok: false as const, motivo: 'no_encontrada' as const };
  if (solicitud.estado !== 'PENDIENTE') {
    return { ok: false as const, motivo: 'no_pendiente' as const, estadoActual: solicitud.estado };
  }
  if (estaExpirada(solicitud.createdAt)) {
    await prisma.loginRequest.update({
      where: { id },
      data: { estado: 'EXPIRADA', resueltaAt: new Date() },
    });
    return { ok: false as const, motivo: 'expirada' as const };
  }

  await prisma.loginRequest.update({
    where: { id },
    data: { estado: 'ACEPTADA', resueltaAt: new Date() },
  });

  const trabajador = await prisma.user.findUnique({ where: { id: solicitud.userId } });
  if (!trabajador) return { ok: false as const, motivo: 'no_encontrada' as const };

  await createOtpForUser(trabajador.id, trabajador.email);

  return { ok: true as const };
}

export async function rechazarLoginRequest(id: string) {
  const solicitud = await prisma.loginRequest.findUnique({ where: { id } });

  if (!solicitud) return { ok: false as const, motivo: 'no_encontrada' as const };
  if (solicitud.estado !== 'PENDIENTE') {
    return { ok: false as const, motivo: 'no_pendiente' as const, estadoActual: solicitud.estado };
  }

  await prisma.loginRequest.update({
    where: { id },
    data: { estado: 'RECHAZADA', resueltaAt: new Date() },
  });

  return { ok: true as const };
}

export async function consultarEstado(id: string, email: string) {
  const solicitud = await prisma.loginRequest.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!solicitud || solicitud.user.email !== email) {
    return null;
  }

  if (solicitud.estado === 'PENDIENTE' && estaExpirada(solicitud.createdAt)) {
    const actualizada = await prisma.loginRequest.update({
      where: { id },
      data: { estado: 'EXPIRADA', resueltaAt: new Date() },
    });
    return actualizada.estado;
  }

  return solicitud.estado;
}