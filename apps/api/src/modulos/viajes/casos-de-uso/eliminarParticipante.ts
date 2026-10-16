import type { DependenciasViajes } from './dependencias.js';
import { modificarViaje } from './modificarViaje.js';

/** CU03. */
export class EliminarParticipante {
  constructor(private readonly deps: DependenciasViajes) {}

  ejecutar(viajeId: string, solicitanteId: string, usuarioId: string): Promise<boolean> {
    return modificarViaje(this.deps, viajeId, async (viaje, repos) => {
      const tieneDeuda = (await repos.deudas.totalAdeudado(viajeId, usuarioId)) > 0;
      viaje.eliminarParticipante(solicitanteId, usuarioId, tieneDeuda, this.deps.reloj.ahora());
      await repos.votos.retirarVotosPendientes(viajeId, usuarioId);
      return tieneDeuda;
    });
  }
}
