import type { DatosEmailContrasena, EmailContrasena } from '../dominio/emailContrasena.js';
import type { Cuenta, RepositorioCuentas } from '../dominio/puertos.js';
import type { ServicioDeSesiones, SesionNueva } from '../dominio/servicioDeSesiones.js';
import { cuentaExistente } from './cuentaExistente.js';

export interface ResultadoIngreso {
  cuenta: Cuenta;
  sesion: SesionNueva;
}

export class IniciarSesion {
  constructor(
    private readonly proveedor: EmailContrasena,
    private readonly cuentas: RepositorioCuentas,
    private readonly sesiones: ServicioDeSesiones,
  ) {}

  async ejecutar(datos: DatosEmailContrasena): Promise<ResultadoIngreso> {
    const usuarioId = await this.proveedor.autenticar(datos);
    const cuenta = await cuentaExistente(this.cuentas, usuarioId);
    return { cuenta, sesion: await this.sesiones.crear(usuarioId) };
  }
}
