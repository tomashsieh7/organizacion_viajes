import type { ActividadVista, AlojamientoVista, DetalleViaje } from '@viajes/compartido';
import { diasEntre } from './fechas';

/**
 * Progreso del viaje para la pantalla Resumen. Es solo presentación: se calcula con los datos que
 * ya devuelve la API y no reemplaza ninguna regla del backend.
 */

export type ClaveHito = 'grupo' | 'noches' | 'dias' | 'resueltas' | 'votos' | 'cuentas';

export interface Hito {
  clave: ClaveHito;
  titulo: string;
  /** Cuánto se cumplió, de 0 a 1. */
  avance: number;
  hecho: boolean;
  /** "4/6" cuando el hito se mide por partes; vacío si es de sí o no. */
  fraccion: string;
  detalle: string;
}

export interface DatosProgreso {
  viaje: Pick<
    DetalleViaje,
    'fechaInicio' | 'fechaFin' | 'cantidadParticipantes' | 'miDeudaPendiente'
  >;
  alojamientos: AlojamientoVista[];
  actividades: ActividadVista[];
  /** Fecha del dispositivo (P19): durante el viaje, lo que ya pasó deja de estar pendiente. */
  hoy: string;
}

export interface Progreso {
  /** Porcentaje entero de 0 a 100: el promedio del avance de los hitos. */
  porcentaje: number;
  hitos: Hito[];
  /** Noches sin alojamiento confirmado y días sin actividades confirmadas, para los próximos pasos. */
  nochesLibres: string[];
  diasLibres: string[];
  pendientes: number;
  sinMiVoto: number;
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

function hito(
  clave: ClaveHito,
  titulo: string,
  hechas: number,
  total: number,
  detalle: string,
  porPartes: boolean,
): Hito {
  const avance = total === 0 ? 1 : hechas / total;
  return {
    clave,
    titulo,
    avance,
    hecho: avance === 1,
    fraccion: porPartes && total > 0 ? `${hechas}/${total}` : '',
    detalle,
  };
}

export function calcularProgreso({
  viaje,
  alojamientos,
  actividades,
  hoy,
}: DatosProgreso): Progreso {
  // Con el viaje en curso cuentan solo hoy y los días que vienen.
  const dias = diasEntre(viaje.fechaInicio, viaje.fechaFin).filter((d) => d >= hoy);
  // RN-C3: el día de salida no es una noche.
  const noches = diasEntre(viaje.fechaInicio, viaje.fechaFin)
    .slice(0, -1)
    .filter((n) => n >= hoy);
  const confirmados = alojamientos.filter((a) => a.estado === 'CONFIRMADA');
  const nochesLibres = noches.filter(
    (n) => !confirmados.some((a) => a.alojamiento.fechaDesde <= n && n < a.alojamiento.fechaHasta),
  );
  const diasConActividad = new Set(
    actividades.filter((a) => a.estado === 'CONFIRMADA').map((a) => a.actividad.fecha),
  );
  const diasLibres = dias.filter((d) => !diasConActividad.has(d));
  const propuestasPendientes = [...alojamientos, ...actividades].filter(
    (p) => p.estado === 'PENDIENTE',
  );
  const sinMiVoto = propuestasPendientes.filter((p) => p.miVoto === null).length;
  const pendientes = propuestasPendientes.length;
  // Sin propuestas todavía no hay nada que votar ni resolver: esos hitos no cuentan como cumplidos.
  const hayPropuestas = alojamientos.length + actividades.length > 0;
  const sinPropuestas = 'Todavía no hay propuestas';
  const viajeros = viaje.cantidadParticipantes;

  const hitos: Hito[] = [
    hito(
      'grupo',
      'Se sumó el grupo',
      Math.min(viajeros, 2) - 1,
      1,
      plural(viajeros, 'viajero', 'viajeros'),
      false,
    ),
    hito(
      'noches',
      'Alojamiento para todas las noches',
      noches.length - nochesLibres.length,
      noches.length,
      nochesLibres.length ? plural(nochesLibres.length, 'noche sin lugar', 'noches sin lugar') : '',
      true,
    ),
    hito(
      'dias',
      'Actividades en cada día',
      dias.length - diasLibres.length,
      dias.length,
      diasLibres.length ? plural(diasLibres.length, 'día libre', 'días libres') : '',
      true,
    ),
    hito(
      'resueltas',
      'Propuestas resueltas',
      hayPropuestas && pendientes === 0 ? 1 : 0,
      1,
      !hayPropuestas
        ? sinPropuestas
        : pendientes
          ? `${plural(pendientes, 'espera', 'esperan')} la decisión del Admin`
          : '',
      false,
    ),
    hito(
      'votos',
      'Votaste todas las propuestas',
      hayPropuestas && sinMiVoto === 0 ? 1 : 0,
      1,
      !hayPropuestas
        ? sinPropuestas
        : sinMiVoto
          ? `Te ${sinMiVoto === 1 ? 'falta 1' : `faltan ${sinMiVoto}`}`
          : '',
      false,
    ),
    hito(
      'cuentas',
      'Tus cuentas están al día',
      viaje.miDeudaPendiente === 0 ? 1 : 0,
      1,
      viaje.miDeudaPendiente > 0 ? 'Tenés deudas por saldar' : '',
      false,
    ),
  ];
  const promedio = hitos.reduce((t, h) => t + h.avance, 0) / hitos.length;
  return {
    porcentaje: Math.floor(promedio * 100),
    hitos,
    nochesLibres,
    diasLibres,
    pendientes,
    sinMiVoto,
  };
}

export type CuentaRegresiva =
  | { etapa: 'antes'; dias: number; texto: string }
  | { etapa: 'durante'; dia: number; total: number; texto: string }
  | { etapa: 'despues'; texto: string };

/** Cuánto falta para el viaje, o en qué día va, según la fecha del dispositivo (P19). */
export function cuentaRegresiva(
  fechaInicio: string,
  fechaFin: string,
  hoy: string,
): CuentaRegresiva {
  if (hoy < fechaInicio) {
    const dias = diasEntre(hoy, fechaInicio).length - 1;
    return { etapa: 'antes', dias, texto: dias === 1 ? '¡Empieza mañana!' : `Faltan ${dias} días` };
  }
  if (hoy <= fechaFin) {
    const dia = diasEntre(fechaInicio, hoy).length;
    const total = diasEntre(fechaInicio, fechaFin).length;
    return { etapa: 'durante', dia, total, texto: `Día ${dia} de ${total}` };
  }
  return { etapa: 'despues', texto: 'Viaje terminado' };
}
