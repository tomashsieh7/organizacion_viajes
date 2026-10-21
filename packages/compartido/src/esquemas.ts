import { z } from 'zod';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Día calendario `YYYY-MM-DD` que existe (por ejemplo, rechaza el 30 de febrero). */
export const esquemaFecha = z
  .string()
  .min(1, { message: 'Elegí una fecha', abort: true })
  .regex(FECHA, 'Usá el formato AAAA-MM-DD')
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, 'La fecha no existe');

/** RN-X7: primer y último día que puede tener un viaje, para que un año mal tipeado se note. */
export const FECHA_MINIMA_VIAJE = '2000-01-01';
export const FECHA_MAXIMA_VIAJE = '2100-12-31';

const fechaDeViaje = esquemaFecha.refine(
  (v) => v >= FECHA_MINIMA_VIAJE && v <= FECHA_MAXIMA_VIAJE,
  'Elegí una fecha entre el año 2000 y el 2100',
);

/**
 * RN-X7: último día que puede tener un viaje que empieza en `fecha`, un año después. Un 29 de
 * febrero pasa al 28, porque el año siguiente no es bisiesto.
 */
export function unAnioDespues(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number) as [number, number, number];
  // Las fechas tienen cuatro dígitos: después de 9999 no hay fecha válida con la que comparar.
  if (anio >= 9999) return '9999-12-31';
  const d = mes === 2 && dia === 29 ? 28 : dia;
  return `${anio + 1}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export const CONTRASENA_MIN = 8;
export const CONTRASENA_MAX = 128;

/** Largos máximos de los textos; la web los usa también como `maxlength` de cada campo. */
export const LARGOS_MAXIMOS = {
  // El máximo que admite una dirección de email (RFC 5321).
  email: 254,
  nombrePersona: 80,
  apodo: 40,
  nombreViaje: 80,
  destino: 120,
  titulo: 120,
  descripcion: 1000,
  ubicacion: 200,
} as const;

const hasta = (n: number) => `Puede tener hasta ${n} caracteres`;

/**
 * RN-S7 y RN-X8: caracteres de control (como el nulo o el salto de línea) y los que invierten la
 * dirección del texto, con los que un nombre puede verse como otro.
 */
const PROHIBIDOS = /[\p{Cc}\u202A-\u202E\u2066-\u2069]/u;
export const sinCaracteresProhibidos = (v: string) => !PROHIBIDOS.test(v);
export const CARACTERES_PROHIBIDOS = 'Tiene caracteres que no se pueden usar';

/** RN-S7 y RN-X8: tiene al menos una letra, número, signo o símbolo (los emojis entre ellos). */
const seVe = (v: string) => /[\p{L}\p{N}\p{P}\p{S}]/u.test(v);

/** RN-X8: en un texto de varias líneas valen además el salto de línea y la tabulación. */
const sinProhibidosEnVariasLineas = (v: string) =>
  sinCaracteresProhibidos(v.replace(/[\n\r\t]/g, ''));

/** RN-X8: texto obligatorio de varias líneas, que se ve y no tiene caracteres prohibidos. */
const textoDeVariasLineas = (largoMaximo: number, siFalta: string) =>
  z
    .string()
    .trim()
    .max(largoMaximo, hasta(largoMaximo))
    .refine(sinProhibidosEnVariasLineas, CARACTERES_PROHIBIDOS)
    .refine(seVe, siFalta);

/** RN-S7 y RN-X8: texto obligatorio de una línea, que se ve y no tiene caracteres prohibidos. */
const textoDeUnaLinea = (largoMaximo: number, siFalta: string) =>
  z
    .string()
    .trim()
    .max(largoMaximo, hasta(largoMaximo))
    .refine(sinCaracteresProhibidos, CARACTERES_PROHIBIDOS)
    .refine(seVe, siFalta);

export const esquemaEmail = z
  .string()
  .trim()
  .max(LARGOS_MAXIMOS.email, hasta(LARGOS_MAXIMOS.email))
  .toLowerCase()
  .pipe(z.email('Ingresá un email válido'));

export const esquemaRegistro = z.object({
  email: esquemaEmail,
  password: z
    .string()
    .min(CONTRASENA_MIN, `La contraseña debe tener al menos ${CONTRASENA_MIN} caracteres`)
    .max(CONTRASENA_MAX, `La contraseña puede tener hasta ${CONTRASENA_MAX} caracteres`),
  nombre: textoDeUnaLinea(LARGOS_MAXIMOS.nombrePersona, 'Ingresá tu nombre'),
  apodo: z
    .string()
    .trim()
    .max(LARGOS_MAXIMOS.apodo, hasta(LARGOS_MAXIMOS.apodo))
    .refine(sinCaracteresProhibidos, CARACTERES_PROHIBIDOS)
    .refine((v) => v === '' || seVe(v), 'Usá letras, números o símbolos, o dejalo vacío')
    .optional(),
});
export type DatosRegistro = z.input<typeof esquemaRegistro>;

export const esquemaInicioSesion = z.object({
  email: esquemaEmail,
  password: z
    .string()
    .min(1, 'Ingresá tu contraseña')
    .max(CONTRASENA_MAX, `La contraseña puede tener hasta ${CONTRASENA_MAX} caracteres`),
});
export type DatosInicioSesion = z.input<typeof esquemaInicioSesion>;

export const esquemaViajeNuevo = z
  .object({
    /**
     * Identificador que genera el formulario: si la respuesta se pierde y la persona reintenta,
     * el servidor reconoce el viaje ya creado y no lo duplica.
     */
    id: z.uuid().optional(),
    nombre: textoDeUnaLinea(LARGOS_MAXIMOS.nombreViaje, 'Ingresá un nombre'),
    destino: textoDeUnaLinea(LARGOS_MAXIMOS.destino, 'Ingresá un destino'),
    fechaInicio: fechaDeViaje,
    fechaFin: fechaDeViaje,
    monedaCodigo: z.string().length(3, 'Elegí una moneda'),
  })
  .refine((v) => v.fechaInicio <= v.fechaFin, {
    message: 'La fecha de inicio no puede ser posterior a la de fin',
    path: ['fechaFin'],
  })
  .refine((v) => v.fechaFin <= unAnioDespues(v.fechaInicio), {
    message: 'Un viaje puede durar hasta un año',
    path: ['fechaFin'],
  });
export type DatosViajeNuevo = z.input<typeof esquemaViajeNuevo>;

export const esquemaAgregarViajero = z.object({ email: esquemaEmail });

export const esquemaSalirDelViaje = z.object({ nuevoAdminId: z.uuid().optional() });

export const esquemaTraspaso = z.object({ nuevoAdminId: z.uuid('Elegí a un participante') });

export const ESTADOS_PROPUESTA = ['PENDIENTE', 'CONFIRMADA', 'DENEGADA', 'CANCELADA'] as const;
export const VALORES_VOTO = ['A_FAVOR', 'EN_CONTRA'] as const;

export const esquemaVoto = z.object({ valor: z.enum(VALORES_VOTO, 'Elegí a favor o en contra') });

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
    titulo: z
      .string()
      .trim()
      .min(1, 'Ingresá un título')
      .max(LARGOS_MAXIMOS.titulo, hasta(LARGOS_MAXIMOS.titulo)),
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
  descripcion: textoDeVariasLineas(LARGOS_MAXIMOS.descripcion, 'Ingresá una descripción'),
  ubicacion: textoDeUnaLinea(LARGOS_MAXIMOS.ubicacion, 'Ingresá la ubicación'),
  ...coordenadas,
  precio: z
    .number()
    .int('El precio va en centavos')
    .min(0, 'El precio no puede ser negativo')
    .max(Number.MAX_SAFE_INTEGER, 'El precio es demasiado grande')
    .optional(),
};

const coordenadasCompletas = (v: { latitud?: number | undefined; longitud?: number | undefined }) =>
  (v.latitud === undefined) === (v.longitud === undefined);

export const esquemaAlojamientoNuevo = z
  .object({
    /** Identificador que genera el formulario, para que un reintento no duplique la propuesta. */
    id: z.uuid().optional(),
    nombre: textoDeUnaLinea(LARGOS_MAXIMOS.titulo, 'Ingresá el nombre del alojamiento'),
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
  titulo: z
    .string()
    .trim()
    .min(1, 'Ingresá un título')
    .max(LARGOS_MAXIMOS.titulo, hasta(LARGOS_MAXIMOS.titulo)),
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
