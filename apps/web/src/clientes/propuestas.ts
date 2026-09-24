import type { InjectionKey } from 'vue';
import type {
  AccionSobrePropuesta,
  ActividadVista,
  AlojamientoVista,
  DatosActividadNueva,
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
  listarActividades(viajeId: string, estado?: EstadoPropuesta): Promise<ActividadVista[]>;
  obtenerActividad(viajeId: string, actividadId: string): Promise<ActividadVista>;
  proponerActividad(viajeId: string, datos: DatosActividadNueva): Promise<ActividadVista>;
  proponerAlternativa(
    viajeId: string,
    actividadId: string,
    datos: DatosActividadNueva,
  ): Promise<ActividadVista>;
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
  async listarActividades(viajeId: string, estado?: EstadoPropuesta) {
    const filtro = estado ? `?estado=${estado}` : '';
    return (
      await pedir<{ actividades: ActividadVista[] }>(
        'GET',
        `/api/viajes/${viajeId}/actividades${filtro}`,
      )
    ).actividades;
  }
  async obtenerActividad(viajeId: string, actividadId: string) {
    return (
      await pedir<{ actividad: ActividadVista }>(
        'GET',
        `/api/viajes/${viajeId}/actividades/${actividadId}`,
      )
    ).actividad;
  }
  async proponerActividad(viajeId: string, datos: DatosActividadNueva) {
    return (
      await pedir<{ actividad: ActividadVista }>(
        'POST',
        `/api/viajes/${viajeId}/actividades`,
        datos,
      )
    ).actividad;
  }
  async proponerAlternativa(viajeId: string, actividadId: string, datos: DatosActividadNueva) {
    return (
      await pedir<{ actividad: ActividadVista }>(
        'POST',
        `/api/viajes/${viajeId}/actividades/${actividadId}/alternativas`,
        datos,
      )
    ).actividad;
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
