import type { ConflictoHorario } from '@viajes/compartido';
import type { Intervalo } from '../../../compartido/valores/intervalo.js';
import type { Actividad } from './actividad.js';

/** Actividad ya ubicada en la agenda del viaje, con su intervalo. */
export interface ActividadAgendada extends ConflictoHorario {
  intervalo: Intervalo;
}

/**
 * RN-A2 y RN-R3 (P10): decide con qué actividades choca una candidata. Es un punto de variación
 * previsto: en el Release 3 los subgrupos permiten actividades superpuestas sin participantes en
 * común, con otra implementación de esta interfaz.
 */
export interface PoliticaSuperposicion {
  conflictos(
    candidata: { id: string; intervalo: Intervalo },
    confirmadas: ActividadAgendada[],
  ): ActividadAgendada[];
}

/** MVP: ninguna actividad puede superponerse con otra ya confirmada del viaje. */
export class SinSuperposicionConConfirmadas implements PoliticaSuperposicion {
  conflictos(
    candidata: { id: string; intervalo: Intervalo },
    confirmadas: ActividadAgendada[],
  ): ActividadAgendada[] {
    return confirmadas.filter(
      (a) => a.id !== candidata.id && a.intervalo.seSuperponeCon(candidata.intervalo),
    );
  }
}

/**
 * RN-R4 (P9): qué pasa con las demás opciones de un grupo cuando se confirma una. También es un
 * punto de variación previsto para los subgrupos del Release 3.
 */
export interface PoliticaResolucionOpciones {
  /** Devuelve las opciones que hay que denegar. */
  opcionesADenegar(confirmada: Actividad, opciones: Actividad[]): Actividad[];
}

/** MVP: al confirmar una opción, las demás pendientes del grupo se deniegan. */
export class DenegarOpcionesRestantes implements PoliticaResolucionOpciones {
  opcionesADenegar(confirmada: Actividad, opciones: Actividad[]): Actividad[] {
    return opciones.filter((o) => o.id !== confirmada.id && o.propuesta.estado === 'PENDIENTE');
  }
}
