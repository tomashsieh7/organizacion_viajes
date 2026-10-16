import type { ClientePrisma } from '../../../comun/infraestructura/clientePrisma.js';
import type { RepositorioSesiones, SesionGuardada } from '../dominio/puertos.js';

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

  async borrarTerminadas(usuarioId: string, ahora: Date): Promise<void> {
    await this.db.sesion.deleteMany({
      where: { usuarioId, OR: [{ expiraEn: { lte: ahora } }, { revocadaEn: { not: null } }] },
    });
  }
}
