import { ErrorDeDominio } from '../../../comun/errores.js';
import {
  esViolacionDeUnicidad,
  type ClientePrisma,
} from '../../../comun/infraestructura/clientePrisma.js';
import type {
  Cuenta,
  CredencialGuardada,
  NuevaCuenta,
  RepositorioCuentas,
  TipoCredencial,
} from '../dominio/puertos.js';

const aCuenta = (u: { id: string; nombre: string; apodo: string | null }): Cuenta => ({
  usuarioId: u.id,
  nombre: u.nombre,
  apodo: u.apodo,
});

export class RepositorioCuentasPrisma implements RepositorioCuentas {
  constructor(private readonly db: ClientePrisma) {}

  async crear(datos: NuevaCuenta): Promise<Cuenta> {
    try {
      const usuario = await this.db.usuario.create({
        data: {
          nombre: datos.nombre,
          apodo: datos.apodo,
          credenciales: {
            create: {
              tipo: datos.tipo,
              identificador: datos.identificador,
              secretoHash: datos.secretoHash,
            },
          },
        },
      });
      return aCuenta(usuario);
    } catch (error) {
      if (esViolacionDeUnicidad(error)) {
        throw new ErrorDeDominio(
          'CONFLICTO',
          'IDENTIFICADOR_EN_USO',
          'La credencial ya está registrada',
        );
      }
      throw error;
    }
  }

  async buscarCredencial(
    tipo: TipoCredencial,
    identificador: string,
  ): Promise<CredencialGuardada | null> {
    const c = await this.db.credencial.findUnique({
      where: { tipo_identificador: { tipo, identificador } },
    });
    return c ? { usuarioId: c.usuarioId, secretoHash: c.secretoHash } : null;
  }

  async obtener(usuarioId: string): Promise<Cuenta | null> {
    const u = await this.db.usuario.findUnique({ where: { id: usuarioId } });
    return u ? aCuenta(u) : null;
  }
}
