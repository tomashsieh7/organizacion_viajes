import type { ClientePrisma } from '../../../comun/infraestructura/clientePrisma.js';
import type { ConsultaOrigenesDePropuestas, OrigenDePropuesta } from '../dominio/puertos.js';

export class ConsultaOrigenesDePropuestasPrisma implements ConsultaOrigenesDePropuestas {
  constructor(private readonly db: ClientePrisma) {}

  origen(propuestaId: string): Promise<OrigenDePropuesta | null> {
    return this.db.propuesta.findUnique({
      where: { id: propuestaId },
      select: { viajeId: true, autorId: true, tipo: true },
    });
  }
}
