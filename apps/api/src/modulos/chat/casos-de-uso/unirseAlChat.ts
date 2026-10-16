import type { ConsultaParticipacion } from '../dominio/puertos.js';
import { exigirParticipante } from './exigirParticipante.js';

/** `chat:unirse`: solo los participantes activos entran a la sala del viaje (RN-X1). */
export class UnirseAlChat {
  constructor(private readonly participacion: ConsultaParticipacion) {}

  ejecutar(viajeId: string, usuarioId: string): Promise<void> {
    return exigirParticipante(this.participacion, viajeId, usuarioId);
  }
}
