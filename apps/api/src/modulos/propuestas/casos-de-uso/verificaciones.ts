import { ErrorDeDominio } from '../../../comun/errores.js';
import type { Propuesta } from '../dominio/propuesta.js';
import type { ConsultaPropuestas, ReposPropuestas } from '../dominio/puertos.js';

export const noEncontrada = () =>
  new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'La propuesta no existe');

export async function cargar<R extends ReposPropuestas>(
  repos: R,
  viajeId: string,
  propuestaId: string,
): Promise<Propuesta> {
  const propuesta = await repos.propuestas.obtenerParaModificar(viajeId, propuestaId);
  if (!propuesta) throw noEncontrada();
  return propuesta;
}

export async function vista(
  consultas: ConsultaPropuestas,
  viajeId: string,
  propuestaId: string,
  usuarioId: string,
) {
  const v = await consultas.obtenerVista(viajeId, propuestaId, usuarioId);
  if (!v) throw noEncontrada();
  return v;
}
