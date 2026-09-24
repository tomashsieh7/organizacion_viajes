import type { PuntoDelRecorrido } from '@viajes/compartido';

/**
 * D10 (P20): traza el recorrido que une las actividades del día en el orden dado. Es un punto de
 * extensión: el trazado por calles del Release 4 es otra implementación de esta interfaz. Es
 * asíncrona porque esa implementación va a consultar un servicio externo.
 */
export interface ProveedorRecorrido {
  /** Devuelve la línea que pasa por todos los puntos en orden, empezando y terminando en ellos. */
  trazar(puntos: PuntoDelRecorrido[]): Promise<PuntoDelRecorrido[]>;
}

/** MVP: líneas rectas entre puntos consecutivos. */
export class RecorridoEnLineaRecta implements ProveedorRecorrido {
  async trazar(puntos: PuntoDelRecorrido[]): Promise<PuntoDelRecorrido[]> {
    return puntos.map(({ latitud, longitud }) => ({ latitud, longitud }));
  }
}
