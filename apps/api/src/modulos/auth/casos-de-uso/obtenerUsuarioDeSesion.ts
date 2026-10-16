import type { ServicioDeSesiones } from '../dominio/servicioDeSesiones.js';

/** Resuelve quién es el usuario de una sesión; lo usa el middleware `autenticado`. */
export class ObtenerUsuarioDeSesion {
  constructor(private readonly sesiones: ServicioDeSesiones) {}

  ejecutar(token: string | undefined): Promise<string> {
    return this.sesiones.validar(token);
  }
}
