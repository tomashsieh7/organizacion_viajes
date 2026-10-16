import type { Cuenta, RepositorioCuentas } from '../dominio/puertos.js';
import { cuentaExistente } from './cuentaExistente.js';

export class ObtenerPerfil {
  constructor(private readonly cuentas: RepositorioCuentas) {}

  ejecutar(usuarioId: string): Promise<Cuenta> {
    return cuentaExistente(this.cuentas, usuarioId);
  }
}
