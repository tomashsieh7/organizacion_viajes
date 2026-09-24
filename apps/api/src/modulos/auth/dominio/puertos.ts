export type TipoCredencial = 'EMAIL_CONTRASENA';

export interface Cuenta {
  usuarioId: string;
  nombre: string;
  apodo: string | null;
}

export interface CredencialGuardada {
  usuarioId: string;
  secretoHash: string | null;
}

export interface NuevaCuenta {
  nombre: string;
  apodo: string | null;
  tipo: TipoCredencial;
  identificador: string;
  secretoHash: string | null;
}

/** Usuarios y sus credenciales. `crear` lanza CONFLICTO `IDENTIFICADOR_EN_USO` si ya existe. */
export interface RepositorioCuentas {
  crear(datos: NuevaCuenta): Promise<Cuenta>;
  buscarCredencial(tipo: TipoCredencial, identificador: string): Promise<CredencialGuardada | null>;
  obtener(usuarioId: string): Promise<Cuenta | null>;
}

export interface SesionGuardada {
  usuarioId: string;
  expiraEn: Date;
  revocadaEn: Date | null;
}

/** Sesiones guardadas por el hash de su token; el token en claro nunca se guarda (D5). */
export interface RepositorioSesiones {
  crear(datos: { usuarioId: string; tokenHash: string; expiraEn: Date }): Promise<void>;
  buscarPorTokenHash(tokenHash: string): Promise<SesionGuardada | null>;
  revocar(tokenHash: string, ahora: Date): Promise<void>;
}

export interface HasheadorDeContrasenas {
  hashear(contrasena: string): Promise<string>;
  verificar(hash: string, contrasena: string): Promise<boolean>;
}

export interface GeneradorDeTokens {
  /** Token aleatorio de 256 bits, apto para una cookie. */
  generar(): string;
  hashear(token: string): string;
}

/**
 * Forma de ingresar (D7). Cada proveedor verifica sus credenciales y devuelve el usuario,
 * o lanza NO_AUTENTICADO `CREDENCIALES_INVALIDAS`. Sumar teléfono o Google es agregar otra
 * implementación, sin tocar sesiones ni el resto de la aplicación.
 */
export interface ProveedorAutenticacion<D> {
  readonly tipo: TipoCredencial;
  autenticar(datos: D): Promise<string>;
}
