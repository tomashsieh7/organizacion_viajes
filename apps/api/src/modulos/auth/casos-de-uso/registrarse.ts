import type { DatosRegistroEmail, EmailContrasena } from '../dominio/emailContrasena.js';
import type { ServicioDeSesiones } from '../dominio/servicioDeSesiones.js';
import type { ResultadoIngreso } from './iniciarSesion.js';

/** Registro con email y contraseña; deja la sesión iniciada. */
export class Registrarse {
  constructor(
    private readonly proveedor: EmailContrasena,
    private readonly sesiones: ServicioDeSesiones,
  ) {}

  async ejecutar(datos: DatosRegistroEmail): Promise<ResultadoIngreso> {
    const cuenta = await this.proveedor.registrar(datos);
    return { cuenta, sesion: await this.sesiones.crear(cuenta.usuarioId) };
  }
}
