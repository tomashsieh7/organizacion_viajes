import type { InjectionKey } from 'vue';
import type {
  DatosViaje,
  DatosViajeNuevo,
  DetalleViaje,
  Moneda,
  Participante,
  RespuestaBaja,
  RespuestaDatosViaje,
  ResumenViaje,
} from '@viajes/compartido';
import { pedir } from './http';

export interface ClienteViajes {
  monedas(): Promise<Moneda[]>;
  listar(): Promise<ResumenViaje[]>;
  crear(datos: DatosViajeNuevo): Promise<DetalleViaje>;
  obtener(viajeId: string): Promise<DetalleViaje>;
  /** CU27: solo el Admin; responde 409 `REACOMODO_NECESARIO` si algo queda afuera (RN-V3). */
  modificarDatos(viajeId: string, datos: DatosViaje): Promise<RespuestaDatosViaje>;
  participantes(viajeId: string): Promise<Participante[]>;
  agregarViajero(viajeId: string, email: string): Promise<Participante>;
  eliminarParticipante(viajeId: string, usuarioId: string): Promise<RespuestaBaja>;
  salir(viajeId: string, nuevoAdminId?: string): Promise<RespuestaBaja>;
  transferirAdministracion(viajeId: string, nuevoAdminId: string): Promise<void>;
}

export const CLIENTE_VIAJES: InjectionKey<ClienteViajes> = Symbol('ClienteViajes');

export class ClienteViajesHttp implements ClienteViajes {
  async monedas() {
    return (await pedir<{ monedas: Moneda[] }>('GET', '/api/monedas')).monedas;
  }
  async listar() {
    return (await pedir<{ viajes: ResumenViaje[] }>('GET', '/api/viajes')).viajes;
  }
  async crear(datos: DatosViajeNuevo) {
    return (await pedir<{ viaje: DetalleViaje }>('POST', '/api/viajes', datos)).viaje;
  }
  async obtener(viajeId: string) {
    return (await pedir<{ viaje: DetalleViaje }>('GET', `/api/viajes/${viajeId}`)).viaje;
  }
  modificarDatos(viajeId: string, datos: DatosViaje) {
    return pedir<RespuestaDatosViaje>('PATCH', `/api/viajes/${viajeId}`, datos);
  }
  async participantes(viajeId: string) {
    return (
      await pedir<{ participantes: Participante[] }>('GET', `/api/viajes/${viajeId}/participantes`)
    ).participantes;
  }
  async agregarViajero(viajeId: string, email: string) {
    return (
      await pedir<{ participante: Participante }>('POST', `/api/viajes/${viajeId}/participantes`, {
        email,
      })
    ).participante;
  }
  eliminarParticipante(viajeId: string, usuarioId: string) {
    return pedir<RespuestaBaja>('DELETE', `/api/viajes/${viajeId}/participantes/${usuarioId}`);
  }
  salir(viajeId: string, nuevoAdminId?: string) {
    return pedir<RespuestaBaja>(
      'POST',
      `/api/viajes/${viajeId}/salir`,
      nuevoAdminId ? { nuevoAdminId } : {},
    );
  }
  transferirAdministracion(viajeId: string, nuevoAdminId: string) {
    return pedir<void>('POST', `/api/viajes/${viajeId}/administracion/traspaso`, { nuevoAdminId });
  }
}
