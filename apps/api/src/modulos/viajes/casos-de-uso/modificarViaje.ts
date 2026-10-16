import { ErrorDeDominio } from '../../../comun/errores.js';
import type { ReposViajes } from '../dominio/puertos.js';
import { Viaje } from '../dominio/viaje.js';
import type { DependenciasViajes } from './dependencias.js';

export const noEncontrado = () =>
  new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'El viaje no existe');

/**
 * Carga el viaje bloqueado, aplica el cambio y lo guarda en una transacción; al confirmar,
 * publica los eventos de dominio que el cambio produjo.
 */
export async function modificarViaje<T>(
  deps: DependenciasViajes,
  viajeId: string,
  cambio: (viaje: Viaje, repos: ReposViajes) => Promise<T>,
): Promise<T> {
  const { resultado, eventos } = await deps.unidad.ejecutar(async (repos) => {
    const viaje = await repos.viajes.obtenerParaModificar(viajeId);
    if (!viaje) throw noEncontrado();
    const resultado = await cambio(viaje, repos);
    await repos.viajes.guardar(viaje);
    return { resultado, eventos: viaje.extraerEventos() };
  });
  for (const evento of eventos) await deps.eventos.publicar(evento);
  return resultado;
}
