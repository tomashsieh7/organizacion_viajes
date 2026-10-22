import {
  esViolacionDeUnicidad,
  type ClientePrisma,
} from '../../../comun/infraestructura/clientePrisma.js';
import { gastoExistente, type Gasto } from '../dominio/gasto.js';
import type { RepositorioGastos } from '../dominio/puertos.js';

export class RepositorioGastosPrisma implements RepositorioGastos {
  constructor(private readonly db: ClientePrisma) {}

  async crear(gasto: Gasto): Promise<void> {
    const { partes, monto, ...g } = gasto.aDatos();
    try {
      await this.db.gasto.create({
        data: {
          ...g,
          monto: BigInt(monto.monto),
          partes: {
            create: partes.map((p) => ({ usuarioId: p.usuarioId, monto: BigInt(p.monto.monto) })),
          },
        },
      });
    } catch (error) {
      if (esViolacionDeUnicidad(error)) throw gastoExistente();
      throw error;
    }
  }
}
