import { ErrorDeDominio } from '../../../comun/errores.js';
import { propuestaExistente } from '../dominio/propuesta.js';
import type { ConsultaOrigenesDePropuestas, OrigenDePropuesta } from '../dominio/puertos.js';

/**
 * CU05, CU10 y CU11: guarda la propuesta una sola vez aunque el mismo intento se repita. El
 * formulario manda el id de la propuesta: si ya existe con ese id en el mismo viaje, de la misma
 * persona y del mismo tipo, es un reintento y no se vuelve a crear. Con el id de una propuesta
 * ajena no se toca nada. Si dos envíos del mismo intento llegan a la vez, el segundo choca al
 * insertar (`crear` lanza `PROPUESTA_EXISTENTE`) y se resuelve volviendo a mirar.
 */
export async function proponerUnaVez(
  origenes: ConsultaOrigenesDePropuestas,
  intento: OrigenDePropuesta & { id: string },
  crear: () => Promise<void>,
): Promise<void> {
  const yaExiste = async () => {
    const origen = await origenes.origen(intento.id);
    if (!origen) return false;
    if (
      origen.viajeId !== intento.viajeId ||
      origen.autorId !== intento.autorId ||
      origen.tipo !== intento.tipo
    ) {
      throw propuestaExistente();
    }
    return true;
  };
  if (await yaExiste()) return;
  try {
    await crear();
  } catch (error) {
    const esDuplicado = error instanceof ErrorDeDominio && error.codigo === 'PROPUESTA_EXISTENTE';
    if (!(esDuplicado && (await yaExiste()))) throw error;
  }
}
