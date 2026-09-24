import { ErrorDeDominio } from '../../../compartido/errores.js';
import {
  esViolacionDeUnicidad,
  type ClientePrisma,
} from '../../../compartido/infraestructura/prisma.js';
import type {
  Cuenta,
  CredencialGuardada,
  NuevaCuenta,
  RepositorioCuentas,
  RepositorioSesiones,
  SesionGuardada,
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

export class RepositorioSesionesPrisma implements RepositorioSesiones {
  constructor(private readonly db: ClientePrisma) {}

  async crear(datos: { usuarioId: string; tokenHash: string; expiraEn: Date }): Promise<void> {
    await this.db.sesion.create({ data: datos });
  }

  async buscarPorTokenHash(tokenHash: string): Promise<SesionGuardada | null> {
    const s = await this.db.sesion.findUnique({ where: { tokenHash } });
    return s ? { usuarioId: s.usuarioId, expiraEn: s.expiraEn, revocadaEn: s.revocadaEn } : null;
  }

  async revocar(tokenHash: string, ahora: Date): Promise<void> {
    await this.db.sesion.updateMany({
      where: { tokenHash, revocadaEn: null },
      data: { revocadaEn: ahora },
    });
  }
}
