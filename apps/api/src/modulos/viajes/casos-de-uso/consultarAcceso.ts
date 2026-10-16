import type { Rol, TipoAcceso } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import type { ConsultaSaldosPendientes, LectorDeViajes } from '../dominio/puertos.js';

/** RN-E6: tipo de acceso de un usuario al viaje, según su membresía y sus saldos pendientes. */
export class ConsultarAcceso {
  constructor(
    private readonly viajes: LectorDeViajes,
    private readonly saldos: ConsultaSaldosPendientes,
  ) {}

  async ejecutar(viajeId: string, usuarioId: string): Promise<{ rol: Rol; tipo: TipoAcceso }> {
    const membresia = (await this.viajes.obtener(viajeId))?.membresiaDe(usuarioId);
    const tipo = membresia?.tipoDeAcceso(
      !membresia.estaActiva() && (await this.saldos.tieneSaldosPendientes(viajeId, usuarioId)),
    );
    if (!membresia || !tipo) {
      throw new ErrorDeDominio('PROHIBIDO', 'NO_PARTICIPANTE', 'No participás de este viaje');
    }
    return { rol: membresia.rol, tipo };
  }
}
