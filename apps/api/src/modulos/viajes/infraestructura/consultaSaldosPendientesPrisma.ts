import type { ClientePrisma } from '../../../comun/infraestructura/clientePrisma.js';
import type { ConsultaSaldosPendientes } from '../dominio/puertos.js';
import { saldosPendientesDe } from './filasPrisma.js';

export class ConsultaSaldosPendientesPrisma implements ConsultaSaldosPendientes {
  constructor(private readonly db: ClientePrisma) {}

  async tieneSaldosPendientes(viajeId: string, usuarioId: string): Promise<boolean> {
    const pendiente = await this.db.deuda.findFirst({
      where: { viajeId, ...saldosPendientesDe(usuarioId) },
      select: { id: true },
    });
    return pendiente !== null;
  }
}
