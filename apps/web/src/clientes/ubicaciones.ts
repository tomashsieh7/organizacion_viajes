import type { InjectionKey } from 'vue';

export interface Ubicacion {
  nombre: string;
  latitud: number;
  longitud: number;
}

/** Busca lugares por texto (D8). La interfaz permite cambiar de proveedor sin tocar las pantallas. */
export interface BuscadorUbicaciones {
  /** Hasta 5 resultados; con menos de 3 caracteres no busca y devuelve una lista vacía. */
  buscar(texto: string): Promise<Ubicacion[]>;
}

export const BUSCADOR_UBICACIONES: InjectionKey<BuscadorUbicaciones> =
  Symbol('BuscadorUbicaciones');

interface ResultadoNominatim {
  display_name: string;
  lat: string;
  lon: string;
}

/**
 * Adaptador de Nominatim (OpenStreetMap). Su política de uso pide no más de una consulta por
 * segundo: el campo de ubicación espera a que se deje de escribir antes de buscar.
 */
export class BuscadorNominatim implements BuscadorUbicaciones {
  constructor(
    private readonly obtener: typeof fetch = (...args) => fetch(...args),
    private readonly base = 'https://nominatim.openstreetmap.org',
  ) {}

  async buscar(texto: string): Promise<Ubicacion[]> {
    const consulta = texto.trim();
    if (consulta.length < 3) return [];
    const parametros = new URLSearchParams({
      q: consulta,
      format: 'jsonv2',
      limit: '5',
      'accept-language': 'es',
    });
    const respuesta = await this.obtener(`${this.base}/search?${parametros}`);
    if (!respuesta.ok) throw new Error('El buscador de lugares no respondió');
    const resultados = (await respuesta.json()) as ResultadoNominatim[];
    return resultados.slice(0, 5).map((r) => ({
      nombre: r.display_name,
      latitud: Number(r.lat),
      longitud: Number(r.lon),
    }));
  }
}
