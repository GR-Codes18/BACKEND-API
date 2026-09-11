import { z } from "zod";

export const crearSolicitudSchema = z.object({
  nombreCompleto: z
    .string()
    .min(3, "El nombre completo debe tener al menos 3 caracteres"),
  correo: z.email("Correo inválido"),
  telefono: z
    .string()
    .regex(/^9\d{8}$/, "El teléfono debe tener 9 dígitos y empezar con 9"),
  mensaje: z
    .string()
    .min(10, "El mensaje debe tener al menos 10 caracteres"),
});

export const responderSolicitudSchema = z.object({
  respuesta: z
    .string()
    .min(10, "La respuesta debe tener al menos 10 caracteres"),
});