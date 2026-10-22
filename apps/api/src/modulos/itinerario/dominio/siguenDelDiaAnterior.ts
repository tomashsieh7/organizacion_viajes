import {
  pasaLaMedianoche,
  type ActividadDelItinerario,
  type ActividadQueSigue,
} from '@viajes/compartido';
import type { Fecha } from '../../../comun/valores/fecha.js';

/** RN-C2 y RN-M9: las actividades del día anterior que terminan después de la medianoche. */
export function siguenDelDiaAnterior(
  actividades: ActividadDelItinerario[],
  diaAnterior: Fecha | undefined,
): ActividadQueSigue[] {
  return actividades
    .filter((a) => a.fecha === diaAnterior && pasaLaMedianoche(a.horaInicio, a.duracionMin))
    .map(({ id, titulo, ubicacion, horaFin }) => ({ id, titulo, ubicacion, horaFin }));
}
