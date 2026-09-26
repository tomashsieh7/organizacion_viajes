import type { ConflictoHorario } from '@viajes/compartido';
import type { Intervalo } from '../../../compartido/valores/intervalo.js';
import type { Actividad } from './actividad.js';

/** Actividad ya ubicada en la agenda del viaje, con su intervalo. */
export interface ActividadAgendada extends ConflictoHorario {
  intervalo: Intervalo;
}

/** RN-A2 y RN-R3 (P10): actividades confirmadas con las que choca una candidata. */
export function conflictosDeHorario(
  candidata: { id: string; intervalo: Intervalo },
  confirmadas: ActividadAgendada[],
): ActividadAgendada[] {
  return confirmadas.filter(
    (a) => a.id !== candidata.id && a.intervalo.seSuperponeCon(candidata.intervalo),
  );
}

/** RN-R4 (P9): al confirmar una opción de un grupo, las demás pendientes se deniegan. */
export function opcionesADenegar(confirmada: Actividad, opciones: Actividad[]): Actividad[] {
  return opciones.filter((o) => o.id !== confirmada.id && o.propuesta.estado === 'PENDIENTE');
}
