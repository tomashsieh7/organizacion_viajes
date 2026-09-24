import type { ActividadDelItinerario, AlojamientoDeLaNoche } from '@viajes/compartido';
import type { RangoFechas } from '../../../compartido/valores/rangoFechas.js';

export interface AlojamientoConfirmado extends AlojamientoDeLaNoche {
  estadia: RangoFechas;
}

/** Lecturas del itinerario: solo lo confirmado (RN-C2, RN-M2). */
export interface ConsultaItinerario {
  /** Actividades confirmadas del viaje, ordenadas por fecha, hora de inicio y título (RN-M4). */
  actividadesConfirmadas(viajeId: string): Promise<ActividadDelItinerario[]>;
  /** Alojamientos confirmados del viaje, ordenados por fecha de entrada. */
  alojamientosConfirmados(viajeId: string): Promise<AlojamientoConfirmado[]>;
}
