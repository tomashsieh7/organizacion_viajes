import { esContrasenaComun } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../compartido/errores.js';
import type {
  Cuenta,
  HasheadorDeContrasenas,
  ProveedorAutenticacion,
  RepositorioCuentas,
} from './puertos.js';

export interface DatosEmailContrasena {
  email: string;
  password: string;
}

export interface DatosRegistroEmail extends DatosEmailContrasena {
  nombre: string;
  apodo?: string | undefined;
}

/** Normaliza un email antes de guardarlo o buscarlo (RN-S2). */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

const credencialesInvalidas = () =>
  new ErrorDeDominio(
    'NO_AUTENTICADO',
    'CREDENCIALES_INVALIDAS',
    'El email o la contraseña no son correctos',
  );

/** Ingreso con email y contraseña (P3), sin envío de correos. */
export class EmailContrasena implements ProveedorAutenticacion<DatosEmailContrasena> {
  readonly tipo = 'EMAIL_CONTRASENA' as const;
  private hashFicticio: Promise<string> | undefined;

  constructor(
    private readonly cuentas: RepositorioCuentas,
    private readonly hasheador: HasheadorDeContrasenas,
  ) {}

  /** RN-S1 y RN-S2: rechaza contraseñas comunes y guarda el email normalizado. */
  async registrar(datos: DatosRegistroEmail): Promise<Cuenta> {
    if (esContrasenaComun(datos.password)) {
      throw new ErrorDeDominio(
        'VALIDACION',
        'CONTRASENA_COMUN',
        'Esa contraseña es demasiado común; elegí otra',
      );
    }
    const secretoHash = await this.hasheador.hashear(datos.password);
    try {
      return await this.cuentas.crear({
        nombre: datos.nombre,
        apodo: datos.apodo?.trim() ? datos.apodo.trim() : null,
        tipo: this.tipo,
        identificador: normalizarEmail(datos.email),
        secretoHash,
      });
    } catch (error) {
      if (error instanceof ErrorDeDominio && error.codigo === 'IDENTIFICADOR_EN_USO') {
        throw new ErrorDeDominio(
          'CONFLICTO',
          'EMAIL_EN_USO',
          'Ya hay una cuenta registrada con ese email',
        );
      }
      throw error;
    }
  }

  /**
   * RN-S3: mismo error y mismo trabajo exista o no el email. Cuando no existe se verifica contra
   * un hash ficticio, así el tiempo de respuesta no revela qué emails están registrados.
   */
  async autenticar(datos: DatosEmailContrasena): Promise<string> {
    const credencial = await this.cuentas.buscarCredencial(this.tipo, normalizarEmail(datos.email));
    const hash = credencial?.secretoHash ?? (await this.obtenerHashFicticio());
    const valida = await this.hasheador.verificar(hash, datos.password);
    if (!credencial || !valida) throw credencialesInvalidas();
    return credencial.usuarioId;
  }

  private obtenerHashFicticio(): Promise<string> {
    this.hashFicticio ??= this.hasheador.hashear('contraseña-ficticia-para-igualar-tiempos');
    return this.hashFicticio;
  }
}
