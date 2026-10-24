import { ErrorDeDominio } from '../../../comun/errores.js';
import type { ReglaAlResolver, ReposPropuestas } from '../../propuestas/dominio/puertos.js';
import type { AgendaDelViaje } from '../dominio/puertos.js';

type ReposConAgenda = ReposPropuestas & { agenda: AgendaDelViaje };

/** RN-V6: confirmar no ubica implícitamente una propuesta sin fecha. */
export class ReglaFechaAlConfirmar implements ReglaAlResolver<ReposConAgenda> {
  async alResolver(
    c: Parameters<ReglaAlResolver<ReposConAgenda>['alResolver']>[0],
  ): Promise<string[]> {
    if (c.accion !== 'confirmar') return [];
    const propuesta = (await c.repos.agenda.propuestas(c.propuesta.viajeId)).find(
      (p) => p.id === c.propuesta.id,
    );
    if (propuesta && !propuesta.dias)
      throw new ErrorDeDominio('CONFLICTO', 'SIN_DIA', 'Ubicá la propuesta antes de confirmarla');
    return [];
  }
}
