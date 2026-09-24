import { ErrorDeDominio } from '../../../compartido/errores.js';
import type {
  DatosEmailContrasena,
  DatosRegistroEmail,
  EmailContrasena,
} from '../dominio/emailContrasena.js';
import type { Cuenta, RepositorioCuentas } from '../dominio/puertos.js';
import type { ServicioDeSesiones, SesionNueva } from '../dominio/servicioDeSesiones.js';

export interface ResultadoIngreso {
  cuenta: Cuenta;
  sesion: SesionNueva;
}

async function cuentaExistente(cuentas: RepositorioCuentas, usuarioId: string): Promise<Cuenta> {
  const cuenta = await cuentas.obtener(usuarioId);
  if (!cuenta)
    throw new ErrorDeDominio('NO_AUTENTICADO', 'NO_AUTENTICADO', 'Tenés que iniciar sesión');
  return cuenta;
}

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

export class CerrarSesion {
  constructor(private readonly sesiones: ServicioDeSesiones) {}

  ejecutar(token: string | undefined): Promise<void> {
    return this.sesiones.revocar(token);
  }
}

/** Resuelve quién es el usuario de una sesión; lo usa el middleware `autenticado`. */
export class ObtenerUsuarioDeSesion {
  constructor(private readonly sesiones: ServicioDeSesiones) {}

  ejecutar(token: string | undefined): Promise<string> {
    return this.sesiones.validar(token);
  }
}

export class ObtenerPerfil {
  constructor(private readonly cuentas: RepositorioCuentas) {}

  ejecutar(usuarioId: string): Promise<Cuenta> {
    return cuentaExistente(this.cuentas, usuarioId);
  }
}
