import type { InjectionKey } from 'vue';
import type {
  AccionSobrePropuesta,
  AlojamientoVista,
  DatosAlojamientoNuevo,
  EstadoPropuesta,
  PropuestaVista,
  RespuestaResolucion,
  ValorVoto,
} from '@viajes/compartido';
import { pedir } from './http';

export interface ClientePropuestas {
  listarAlojamientos(viajeId: string, estado?: EstadoPropuesta): Promise<AlojamientoVista[]>;
  proponerAlojamiento(viajeId: string, datos: DatosAlojamientoNuevo): Promise<AlojamientoVista>;
  votar(viajeId: string, propuestaId: string, valor: ValorVoto): Promise<PropuestaVista>;
  desvotar(viajeId: string, propuestaId: string): Promise<PropuestaVista>;
  resolver(
    viajeId: string,
    propuestaId: string,
    accion: AccionSobrePropuesta,
  ): Promise<RespuestaResolucion>;
}

export const CLIENTE_PROPUESTAS: InjectionKey<ClientePropuestas> = Symbol('ClientePropuestas');

export class ClientePropuestasHttp implements ClientePropuestas {
  async listarAlojamientos(viajeId: string, estado?: EstadoPropuesta) {
    const filtro = estado ? `?estado=${estado}` : '';
    return (
      await pedir<{ alojamientos: AlojamientoVista[] }>(
        'GET',
        `/api/viajes/${viajeId}/alojamientos${filtro}`,
      )
    ).alojamientos;
  }
  async proponerAlojamiento(viajeId: string, datos: DatosAlojamientoNuevo) {
    return (
      await pedir<{ alojamiento: AlojamientoVista }>(
        'POST',
        `/api/viajes/${viajeId}/alojamientos`,
        datos,
      )
    ).alojamiento;
  }
  async votar(viajeId: string, propuestaId: string, valor: ValorVoto) {
    return (
      await pedir<{ propuesta: PropuestaVista }>(
        'PUT',
        `/api/viajes/${viajeId}/propuestas/${propuestaId}/voto`,
        { valor },
      )
    ).propuesta;
  }
  async desvotar(viajeId: string, propuestaId: string) {
    return (
      await pedir<{ propuesta: PropuestaVista }>(
        'DELETE',
        `/api/viajes/${viajeId}/propuestas/${propuestaId}/voto`,
      )
    ).propuesta;
  }
  resolver(viajeId: string, propuestaId: string, accion: AccionSobrePropuesta) {
    return pedir<RespuestaResolucion>(
      'POST',
      `/api/viajes/${viajeId}/propuestas/${propuestaId}/${accion}`,
    );
  }
}
