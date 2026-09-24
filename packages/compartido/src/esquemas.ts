import { z } from 'zod';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Día calendario `YYYY-MM-DD` que existe (por ejemplo, rechaza el 30 de febrero). */
export const esquemaFecha = z
  .string()
  .regex(FECHA, 'Usá el formato AAAA-MM-DD')
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, 'La fecha no existe');

export const CONTRASENA_MIN = 8;
export const CONTRASENA_MAX = 128;

export const esquemaEmail = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Ingresá un email válido'));

export const esquemaRegistro = z.object({
  email: esquemaEmail,
  password: z
    .string()
    .min(CONTRASENA_MIN, `La contraseña debe tener al menos ${CONTRASENA_MIN} caracteres`)
    .max(CONTRASENA_MAX, `La contraseña puede tener hasta ${CONTRASENA_MAX} caracteres`),
  nombre: z.string().trim().min(1, 'Ingresá tu nombre').max(80),
  apodo: z.string().trim().max(40).optional(),
});
export type DatosRegistro = z.input<typeof esquemaRegistro>;

export const esquemaInicioSesion = z.object({
  email: esquemaEmail,
  password: z.string().min(1, 'Ingresá tu contraseña').max(CONTRASENA_MAX),
});
export type DatosInicioSesion = z.input<typeof esquemaInicioSesion>;

export const esquemaViajeNuevo = z
  .object({
    nombre: z.string().trim().min(1, 'Ingresá un nombre').max(80),
    destino: z.string().trim().min(1, 'Ingresá un destino').max(120),
    fechaInicio: esquemaFecha,
    fechaFin: esquemaFecha,
    monedaCodigo: z.string().length(3, 'Elegí una moneda'),
  })
  .refine((v) => v.fechaInicio <= v.fechaFin, {
    message: 'La fecha de inicio no puede ser posterior a la de fin',
    path: ['fechaFin'],
  });
export type DatosViajeNuevo = z.input<typeof esquemaViajeNuevo>;

export const esquemaAgregarViajero = z.object({ email: esquemaEmail });
export type DatosAgregarViajero = z.input<typeof esquemaAgregarViajero>;

export const esquemaSalirDelViaje = z.object({ nuevoAdminId: z.uuid().optional() });
export type DatosSalirDelViaje = z.input<typeof esquemaSalirDelViaje>;

export const esquemaTraspaso = z.object({ nuevoAdminId: z.uuid('Elegí a un participante') });
export type DatosTraspaso = z.input<typeof esquemaTraspaso>;
