import type { Propuesta } from '../../propuestas/dominio/propuesta.js';
import type { RepositorioPropuestas } from '../../propuestas/dominio/puertos.js';
import type { RepositorioActividades } from '../dominio/puertos.js';

/**
 * Decorador del repositorio de propuestas para la transacción de resolución: bloquea la agenda del
 * viaje antes de cargar la propuesta. Así todas las resoluciones toman los bloqueos en el mismo
 * orden (viaje y después propuestas) y dos confirmaciones simultáneas de opciones del mismo grupo
 * no se bloquean mutuamente: la segunda espera y encuentra su opción ya denegada.
 */
export class PropuestasConAgendaBloqueadaPrimero implements RepositorioPropuestas {
  constructor(
    private readonly propuestas: RepositorioPropuestas,
    private readonly actividades: RepositorioActividades,
  ) {}

  async obtenerParaModificar(viajeId: string, propuestaId: string): Promise<Propuesta | null> {
    await this.actividades.bloquearAgenda(viajeId);
    return this.propuestas.obtenerParaModificar(viajeId, propuestaId);
  }

  guardar(propuesta: Propuesta): Promise<void> {
    return this.propuestas.guardar(propuesta);
  }
}
