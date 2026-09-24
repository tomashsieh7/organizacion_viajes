import type { InjectionKey } from 'vue';
import type { Cronograma, MapaDelDia } from '@viajes/compartido';
import { pedir } from './http';

export interface ClienteItinerario {
  cronograma(viajeId: string): Promise<Cronograma>;
  /** `hoy` es la fecha del dispositivo (P19); `dia`, el que eligió el viajero. */
  mapa(viajeId: string, hoy: string, dia?: string): Promise<MapaDelDia>;
}

export const CLIENTE_ITINERARIO: InjectionKey<ClienteItinerario> = Symbol('ClienteItinerario');

export class ClienteItinerarioHttp implements ClienteItinerario {
  cronograma(viajeId: string) {
    return pedir<Cronograma>('GET', `/api/viajes/${viajeId}/cronograma`);
  }
  mapa(viajeId: string, hoy: string, dia?: string) {
    const parametros = new URLSearchParams({ hoy, ...(dia ? { dia } : {}) });
    return pedir<MapaDelDia>('GET', `/api/viajes/${viajeId}/mapa?${parametros.toString()}`);
  }
}
