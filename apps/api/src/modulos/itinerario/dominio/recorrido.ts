import type { PuntoDelRecorrido } from '@viajes/compartido';

/** RN-M6 (P20): el recorrido une las actividades del día con líneas rectas, en el orden dado. */
export function recorridoEnLineaRecta(puntos: PuntoDelRecorrido[]): PuntoDelRecorrido[] {
  return puntos.map(({ latitud, longitud }) => ({ latitud, longitud }));
}
