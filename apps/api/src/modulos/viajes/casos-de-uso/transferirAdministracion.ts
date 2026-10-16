import type { DependenciasViajes } from './dependencias.js';
import { modificarViaje } from './modificarViaje.js';

/** CU24. */
export class TransferirAdministracion {
  constructor(private readonly deps: DependenciasViajes) {}

  async ejecutar(viajeId: string, solicitanteId: string, nuevoAdminId: string): Promise<void> {
    await modificarViaje(this.deps, viajeId, async (viaje) => {
      viaje.transferirAdministracion(solicitanteId, nuevoAdminId);
    });
  }
}
