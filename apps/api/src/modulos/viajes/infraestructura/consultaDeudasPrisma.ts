import type { ClientePrisma } from '../../../comun/infraestructura/clientePrisma.js';
import { aMonto } from '../../../comun/infraestructura/conversiones.js';
import type { ConsultaDeudas } from '../dominio/puertos.js';

export class ConsultaDeudasPrisma implements ConsultaDeudas {
  constructor(private readonly db: ClientePrisma) {}

  async totalAdeudado(viajeId: string, usuarioId: string): Promise<number> {
    const r = await this.db.deuda.aggregate({
      where: { viajeId, deudorId: usuarioId },
      _sum: { monto: true },
    });
    return aMonto(r._sum.monto ?? 0n);
  }
}
