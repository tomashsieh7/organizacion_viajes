import type { InjectionKey } from 'vue';
import type { RespuestaSalud } from '@viajes/compartido';

/** Consulta si la API está disponible. Las vistas dependen de esta interfaz, no de fetch. */
export interface ClienteSalud {
  consultar(): Promise<RespuestaSalud>;
}

export const CLIENTE_SALUD: InjectionKey<ClienteSalud> = Symbol('ClienteSalud');

export class ClienteSaludHttp implements ClienteSalud {
  async consultar(): Promise<RespuestaSalud> {
    const respuesta = await fetch('/api/salud');
    if (!respuesta.ok) throw new Error(`La API respondió ${respuesta.status}`);
    return (await respuesta.json()) as RespuestaSalud;
  }
}
