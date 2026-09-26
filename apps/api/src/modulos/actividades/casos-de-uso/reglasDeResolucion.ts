import type { ReglaAlResolver } from '../../propuestas/dominio/puertos.js';
import { conflictosDeHorario, opcionesADenegar } from '../dominio/politicas.js';
import type { ReposResolucionConActividades } from '../dominio/puertos.js';
import { errorDeSuperposicion } from './casosDeUsoActividades.js';

type Contexto = Parameters<ReglaAlResolver<ReposResolucionConActividades>['alResolver']>[0];

const esConfirmacionDeActividad = (c: Contexto) =>
  c.accion === 'confirmar' && c.propuesta.tipo === 'ACTIVIDAD';

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

/** RN-R4 (P9): al confirmar una opción, se deniegan las demás pendientes del grupo. */
export class ReglaOpcionesAlConfirmar implements ReglaAlResolver<ReposResolucionConActividades> {
  async alResolver(c: Contexto): Promise<string[]> {
    if (!esConfirmacionDeActividad(c)) return [];
    const { viajeId, id } = c.propuesta;
    const confirmada = await c.repos.actividades.obtenerParaModificar(viajeId, id);
    if (!confirmada) return [];
    const opciones = await c.repos.actividades.opcionesDelGrupo(viajeId, confirmada.grupo);
    const aDenegar = opcionesADenegar(confirmada, opciones);
    for (const opcion of aDenegar) {
      opcion.propuesta.resolver('denegar', c.adminId, c.ahora);
      await c.repos.propuestas.guardar(opcion.propuesta);
    }
    return aDenegar.map((o) => o.id);
  }
}
