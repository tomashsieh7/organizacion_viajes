import type { ClientePrisma } from '../../../comun/infraestructura/clientePrisma.js';
import type { RetiroDeVotos } from '../dominio/puertos.js';

export class RetiroDeVotosPrisma implements RetiroDeVotos {
  constructor(private readonly db: ClientePrisma) {}

  async retirarVotosPendientes(viajeId: string, usuarioId: string): Promise<void> {
    await this.db.voto.deleteMany({
      where: { usuarioId, propuesta: { viajeId, estado: 'PENDIENTE' } },
    });
  }
}
