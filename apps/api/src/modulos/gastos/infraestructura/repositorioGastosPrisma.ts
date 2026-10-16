import type { ClientePrisma } from '../../../comun/infraestructura/clientePrisma.js';
import type { Gasto } from '../dominio/gasto.js';
import type { RepositorioGastos } from '../dominio/puertos.js';

export class RepositorioGastosPrisma implements RepositorioGastos {
  constructor(private readonly db: ClientePrisma) {}

  async crear(gasto: Gasto): Promise<void> {
    const { partes, monto, ...g } = gasto.aDatos();
    await this.db.gasto.create({
      data: {
        ...g,
        monto: BigInt(monto.monto),
        partes: {
          create: partes.map((p) => ({ usuarioId: p.usuarioId, monto: BigInt(p.monto.monto) })),
        },
      },
    });
  }
}
