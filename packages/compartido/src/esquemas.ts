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

export const ESTADOS_PROPUESTA = ['PENDIENTE', 'CONFIRMADA', 'DENEGADA', 'CANCELADA'] as const;
export const VALORES_VOTO = ['A_FAVOR', 'EN_CONTRA'] as const;

export const esquemaVoto = z.object({ valor: z.enum(VALORES_VOTO, 'Elegí a favor o en contra') });
export type DatosVoto = z.input<typeof esquemaVoto>;

/** CU17: `hoy` es la fecha del dispositivo (P19); `dia`, el que eligió el viajero. */
export const esquemaConsultaMapa = z.object({
  hoy: esquemaFecha,
  dia: esquemaFecha.optional(),
});

/** CU19: mensaje del chat. */
export const esquemaMensajeNuevo = z.object({
  viajeId: z.uuid('Viaje inválido'),
  contenido: z
    .string()
    .trim()
    .min(1, 'Escribí un mensaje')
    .max(2000, 'El mensaje puede tener hasta 2000 caracteres'),
  idTemporal: z.string().min(1).max(100),
});
export type DatosMensajeNuevo = z.input<typeof esquemaMensajeNuevo>;

/** CU19: página del historial, hacia atrás desde `antesDe`. */
export const esquemaConsultaMensajes = z.object({
  antesDe: z.uuid().optional(),
  limite: z.coerce.number().int().min(1).max(100).default(50),
});

const montoEntero = z
  .number({ error: 'Ingresá un monto' })
  .int('El monto va en la unidad mínima de la moneda')
  .max(Number.MAX_SAFE_INTEGER, 'El monto es demasiado grande');

/**
 * CU20 (RN-G1 a RN-G4): gasto con su pagador, deudores y división. Sin `pagadoPorId`, paga
 * quien lo anota (P12). En `ARBITRARIA`, `partes` trae el monto de cada deudor.
 */
export const esquemaGastoNuevo = z
  .object({
    titulo: z.string().trim().min(1, 'Ingresá un título').max(120),
    categoriaId: z.uuid('Elegí una categoría'),
    monto: montoEntero.positive('El monto tiene que ser mayor que cero'),
    pagadoPorId: z.uuid().optional(),
    deudores: z
      .array(z.uuid())
      .min(1, 'Elegí al menos una persona')
      .refine((d) => new Set(d).size === d.length, 'Hay personas repetidas'),
    modoDivision: z.enum(['IGUALES', 'ARBITRARIA']),
    partes: z
      .array(z.object({ usuarioId: z.uuid(), monto: montoEntero.min(0, 'No puede ser negativo') }))
      .optional(),
  })
  .superRefine((g, ctx) => {
    if (g.modoDivision === 'ARBITRARIA' && !g.partes) {
      ctx.addIssue({ code: 'custom', path: ['partes'], message: 'Indicá cuánto paga cada uno' });
    }
  });
export type DatosGastoNuevo = z.input<typeof esquemaGastoNuevo>;

/** CU23 (RN-P3): pago de una deuda propia; quien lo registra es siempre el deudor (P17). */
export const esquemaPagoNuevo = z.object({
  acreedorId: z.uuid('Elegí a quién le pagás'),
  monto: montoEntero.positive('El monto tiene que ser mayor que cero'),
});
export type DatosPagoNuevo = z.input<typeof esquemaPagoNuevo>;

export const esquemaConsultaDeudas = z.object({ rol: z.enum(['deudor', 'acreedor']) });

export const esquemaFiltroEstado = z.object({ estado: z.enum(ESTADOS_PROPUESTA).optional() });

const coordenadas = {
  latitud: z.number().min(-90).max(90).optional(),
  longitud: z.number().min(-180).max(180).optional(),
};

/** Datos comunes a toda propuesta (P8): descripción, ubicación, coordenadas y precio opcional. */
const baseDePropuesta = {
  descripcion: z.string().trim().min(1, 'Ingresá una descripción').max(1000),
  ubicacion: z.string().trim().min(1, 'Ingresá la ubicación').max(200),
  ...coordenadas,
  precio: z
    .number()
    .int('El precio va en centavos')
    .min(0, 'El precio no puede ser negativo')
    .max(Number.MAX_SAFE_INTEGER)
    .optional(),
};

const coordenadasCompletas = (v: { latitud?: number | undefined; longitud?: number | undefined }) =>
  (v.latitud === undefined) === (v.longitud === undefined);

export const esquemaAlojamientoNuevo = z
  .object({
    nombre: z.string().trim().min(1, 'Ingresá el nombre del alojamiento').max(120),
    ...baseDePropuesta,
    fechaDesde: esquemaFecha,
    fechaHasta: esquemaFecha,
  })
  .refine(coordenadasCompletas, { message: 'Faltan coordenadas', path: ['latitud'] })
  .refine((v) => v.fechaDesde <= v.fechaHasta, {
    message: 'La fecha de salida no puede ser anterior a la de entrada',
    path: ['fechaHasta'],
  });
export type DatosAlojamientoNuevo = z.input<typeof esquemaAlojamientoNuevo>;

export const esquemaHora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Usá el formato HH:MM');

/** RN-A1 y RN-B2: datos de una actividad o de una alternativa; las coordenadas son obligatorias (P8). */
export const esquemaActividadNueva = z.object({
  titulo: z.string().trim().min(1, 'Ingresá un título').max(120),
  ...baseDePropuesta,
  latitud: z.number({ error: 'Marcá la ubicación en el mapa' }).min(-90).max(90),
  longitud: z.number({ error: 'Marcá la ubicación en el mapa' }).min(-180).max(180),
  fecha: esquemaFecha,
  horaInicio: esquemaHora,
  duracionMin: z
    .number({ error: 'Ingresá la duración en minutos' })
    .int('La duración va en minutos enteros')
    .min(1, 'La duración tiene que ser mayor que cero')
    .max(24 * 60, 'La duración puede ser de hasta 24 horas'),
});
export type DatosActividadNueva = z.input<typeof esquemaActividadNueva>;
