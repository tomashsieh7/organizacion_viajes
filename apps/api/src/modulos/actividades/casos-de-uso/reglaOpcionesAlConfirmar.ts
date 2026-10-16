import type { ReglaAlResolver } from '../../propuestas/dominio/puertos.js';
import { opcionesADenegar } from '../dominio/politicas.js';
import type { ReposResolucionConActividades } from '../dominio/puertos.js';
import { type Contexto, esConfirmacionDeActividad } from './esConfirmacionDeActividad.js';

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
