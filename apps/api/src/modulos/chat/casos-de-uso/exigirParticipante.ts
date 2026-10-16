import { ErrorDeDominio } from '../../../comun/errores.js';
import type { ConsultaParticipacion } from '../dominio/puertos.js';

export async function exigirParticipante(
  participacion: ConsultaParticipacion,
  viajeId: string,
  usuarioId: string,
) {
  if (!(await participacion.esParticipanteActivo(viajeId, usuarioId))) {
    throw new ErrorDeDominio('PROHIBIDO', 'NO_PARTICIPANTE', 'No participás de este viaje');
  }
}
