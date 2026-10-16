import type { PropuestaVista } from '@viajes/compartido';
import type { ClientePrisma } from '../../../comun/infraestructura/clientePrisma.js';
import type { ConsultaPropuestas } from '../dominio/puertos.js';
import { aVistaPropuesta, INCLUIR_VISTA } from './vistaPropuesta.js';

export class ConsultaPropuestasPrisma implements ConsultaPropuestas {
  constructor(private readonly db: ClientePrisma) {}

  async obtenerVista(
    viajeId: string,
    propuestaId: string,
    usuarioId: string,
  ): Promise<PropuestaVista | null> {
    const p = await this.db.propuesta.findFirst({
      where: { id: propuestaId, viajeId },
      include: INCLUIR_VISTA,
    });
    return p ? aVistaPropuesta(p, usuarioId) : null;
  }
}
