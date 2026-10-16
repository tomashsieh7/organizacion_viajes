import type { ServicioDeSesiones } from '../dominio/servicioDeSesiones.js';

export class CerrarSesion {
  constructor(private readonly sesiones: ServicioDeSesiones) {}

  ejecutar(token: string | undefined): Promise<void> {
    return this.sesiones.revocar(token);
  }
}
