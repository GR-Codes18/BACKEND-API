import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es demasiado largo'),
  email: z
    .email('Correo electrónico inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const verifyOtpSchema = z.object({
  userId: z.string().min(1, 'El userId es requerido'),
  code: z
    .string()
    .length(6, 'El código debe tener 6 dígitos'),
});

export const loginSchema = z.object({
  email: z.email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const resendOtpSchema = z.object({
  userId: z.string().min(1, 'El userId es requerido'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;