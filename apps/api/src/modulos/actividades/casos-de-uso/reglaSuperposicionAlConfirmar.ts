import type { ReglaAlResolver } from '../../propuestas/dominio/puertos.js';
import { conflictosDeHorario } from '../dominio/politicas.js';
import type { ReposResolucionConActividades } from '../dominio/puertos.js';
import { errorDeSuperposicion } from './verificaciones.js';
import { type Contexto, esConfirmacionDeActividad } from './esConfirmacionDeActividad.js';

/**
 * RN-R3 (P10): al confirmar una actividad se vuelve a controlar la superposición con las
 * confirmadas, con la agenda del viaje bloqueada para que dos confirmaciones no se crucen.
 */
export class ReglaSuperposicionAlConfirmar implements ReglaAlResolver<ReposResolucionConActividades> {
  async alResolver(c: Contexto): Promise<string[]> {
    if (!esConfirmacionDeActividad(c)) return [];
    const { viajeId, id } = c.propuesta;
    await c.repos.actividades.bloquearAgenda(viajeId);
    const actividad = await c.repos.actividades.obtenerParaModificar(viajeId, id);
    if (!actividad) return [];
    const conflictos = conflictosDeHorario(
      { id, intervalo: actividad.intervalo },
      await c.repos.actividades.confirmadas(viajeId),
    );
    if (conflictos.length > 0) throw errorDeSuperposicion(conflictos);
    return [];
  }
}
