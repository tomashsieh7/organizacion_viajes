import { ErrorDeDominio } from '../errores.js';

/** Punto en el mapa (P8). */
export class Coordenadas {
  private constructor(
    readonly latitud: number,
    readonly longitud: number,
  ) {}

  static crear(latitud: number, longitud: number): Coordenadas {
    if (!(latitud >= -90 && latitud <= 90) || !(longitud >= -180 && longitud <= 180)) {
      throw new ErrorDeDominio(
        'VALIDACION',
        'COORDENADAS_INVALIDAS',
        'Las coordenadas están fuera de rango',
      );
    }
    return new Coordenadas(latitud, longitud);
  }

  /** Coordenadas opcionales: ambas o ninguna. */
  static opcionales(latitud?: number | null, longitud?: number | null): Coordenadas | null {
    const hayLat = latitud !== undefined && latitud !== null;
    const hayLng = longitud !== undefined && longitud !== null;
    if (hayLat !== hayLng) {
      throw new ErrorDeDominio('VALIDACION', 'COORDENADAS_INVALIDAS', 'Faltan coordenadas');
    }
    return hayLat && hayLng ? Coordenadas.crear(latitud, longitud) : null;
  }
}
