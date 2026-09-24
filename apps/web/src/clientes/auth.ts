import type { InjectionKey } from 'vue';
import type {
  DatosInicioSesion,
  DatosRegistro,
  RespuestaUsuario,
  Usuario,
} from '@viajes/compartido';
import { pedir } from './http';

/** Operaciones de sesión que usa el frontend; los stores dependen de esta interfaz (D13). */
export interface ClienteAuth {
  registrarse(datos: DatosRegistro): Promise<Usuario>;
  ingresar(datos: DatosInicioSesion): Promise<Usuario>;
  cerrarSesion(): Promise<void>;
  /** Usuario de la sesión actual, o `null` si no hay sesión. */
  yo(): Promise<Usuario | null>;
}

export const CLIENTE_AUTH: InjectionKey<ClienteAuth> = Symbol('ClienteAuth');

export class ClienteAuthHttp implements ClienteAuth {
  async registrarse(datos: DatosRegistro) {
    return (await pedir<RespuestaUsuario>('POST', '/api/auth/registro', datos)).usuario;
  }

  async ingresar(datos: DatosInicioSesion) {
    return (await pedir<RespuestaUsuario>('POST', '/api/auth/sesion', datos)).usuario;
  }

  cerrarSesion() {
    return pedir<void>('DELETE', '/api/auth/sesion');
  }

  async yo() {
    try {
      return (await pedir<RespuestaUsuario>('GET', '/api/auth/yo')).usuario;
    } catch (error) {
      if ((error as { estado?: number }).estado === 401) return null;
      throw error;
    }
  }
}
