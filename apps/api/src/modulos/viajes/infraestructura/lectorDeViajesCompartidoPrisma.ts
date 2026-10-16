import type { ClientePrisma } from '../../../comun/infraestructura/clientePrisma.js';
import type { LectorDeViajes } from '../dominio/puertos.js';
import { Viaje } from '../dominio/viaje.js';
import { RepositorioViajesPrisma } from './repositorioViajesPrisma.js';

/**
 * Lee el viaje con un bloqueo compartido hasta el fin de la transacción: otras lecturas iguales
 * siguen en paralelo, pero un cambio de membresías, que toma el viaje con `FOR UPDATE`, espera.
 */
export class LectorDeViajesCompartidoPrisma implements LectorDeViajes {
  constructor(private readonly db: ClientePrisma) {}

  async obtener(viajeId: string): Promise<Viaje | null> {
    const bloqueado = await this.db.$queryRaw<{ id: string }[]>`
      SELECT id FROM viaje WHERE id = ${viajeId}::uuid FOR SHARE`;
    if (bloqueado.length === 0) return null;
    return new RepositorioViajesPrisma(this.db).obtener(viajeId);
  }
}
