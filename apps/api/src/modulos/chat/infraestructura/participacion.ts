import type { ConsultaViajes } from '../../viajes/dominio/puertos.js';
import type { ConsultaParticipacion } from '../dominio/puertos.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Adaptador: responde la participación con la consulta de accesos del módulo de viajes. */
export class ParticipacionSegunViajes implements ConsultaParticipacion {
  constructor(private readonly viajes: Pick<ConsultaViajes, 'obtenerAcceso'>) {}

  async esParticipanteActivo(viajeId: string, usuarioId: string): Promise<boolean> {
    // Por socket el id llega sin pasar por las rutas, que ya validan el formato.
    if (!UUID.test(viajeId)) return false;
    return (await this.viajes.obtenerAcceso(viajeId, usuarioId)) !== null;
  }
}
