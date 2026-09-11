import { PrismaClient } from "@prisma/client";
import {
  sendSolicitudAlertEmail,
  sendSolicitudRespuestaEmail,
} from "./mail.service";

const prisma = new PrismaClient();

export const crearSolicitud = async (data: {
  nombreCompleto: string;
  correo: string;
  telefono: string;
  mensaje: string;
}) => {
  const solicitud = await prisma.solicitud.create({ data });

  const analista = await prisma.user.findFirst({
    where: { role: "ANALISTA" },
  });

  if (analista) {
    await sendSolicitudAlertEmail(analista.email, solicitud);
  }

  return solicitud;
};

export const listarSolicitudes = async () => {
  return prisma.solicitud.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const responderSolicitud = async (
  id: string,
  respuesta: string
) => {
  const solicitud = await prisma.solicitud.findUnique({ where: { id } });

  if (!solicitud) {
    throw new Error("NOT_FOUND");
  }

  if (solicitud.estado === "RESPONDIDA") {
    throw new Error("YA_RESPONDIDA");
  }

  const actualizada = await prisma.solicitud.update({
    where: { id },
    data: {
      respuesta,
      estado: "RESPONDIDA",
      respondidaAt: new Date(),
    },
  });

  await sendSolicitudRespuestaEmail(actualizada.correo, actualizada.nombreCompleto, respuesta);

  return actualizada;
};

export const editarRespuestaSolicitud = async (
  id: string,
  respuesta: string
) => {
  const solicitud = await prisma.solicitud.findUnique({ where: { id } });

  if (!solicitud) {
    throw new Error("NOT_FOUND");
  }

  if (solicitud.estado !== "RESPONDIDA") {
    throw new Error("NO_RESPONDIDA_AUN");
  }

  const actualizada = await prisma.solicitud.update({
    where: { id },
    data: {
      respuesta,
      respondidaAt: new Date(),
    },
  });

  await sendSolicitudRespuestaEmail(actualizada.correo, actualizada.nombreCompleto, respuesta);

  return actualizada;
};