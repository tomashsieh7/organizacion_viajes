import { esUuid } from '../../../compartido/uuid.js';
import type { ConsultaViajes } from '../../viajes/dominio/puertos.js';
import type { ConsultaParticipacion } from '../dominio/puertos.js';

/** Adaptador: responde la participación con la consulta de accesos del módulo de viajes. */
export class ParticipacionSegunViajes implements ConsultaParticipacion {
  constructor(private readonly viajes: Pick<ConsultaViajes, 'obtenerAcceso'>) {}

  async esParticipanteActivo(viajeId: string, usuarioId: string): Promise<boolean> {
    // Por socket el id llega sin pasar por las rutas, que ya validan el formato.
    if (!esUuid(viajeId)) return false;
    return (await this.viajes.obtenerAcceso(viajeId, usuarioId)) !== null;
  }
}
