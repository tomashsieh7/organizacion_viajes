import type { PaginaDeMensajes } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import type { ConsultaMensajes } from '../dominio/puertos.js';

/** CU19: historial del chat, paginado hacia atrás. */
export class ConsultarMensajes {
  constructor(private readonly consultas: ConsultaMensajes) {}

  async pagina(
    viajeId: string,
    antesDe: string | undefined,
    limite: number,
  ): Promise<PaginaDeMensajes> {
    const pagina = await this.consultas.pagina(viajeId, antesDe, limite);
    if (!pagina) throw new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'El mensaje no existe');
    return pagina;
  }
}
