import type { DependenciasViajes } from './dependencias.js';
import { modificarViaje } from './modificarViaje.js';

/** CU04. */
export class SalirDelViaje {
  constructor(private readonly deps: DependenciasViajes) {}

  ejecutar(viajeId: string, usuarioId: string, nuevoAdminId?: string): Promise<boolean> {
    return modificarViaje(this.deps, viajeId, async (viaje, repos) => {
      const tieneDeuda = (await repos.deudas.totalAdeudado(viajeId, usuarioId)) > 0;
      viaje.salir(usuarioId, nuevoAdminId, tieneDeuda, this.deps.reloj.ahora());
      await repos.votos.retirarVotosPendientes(viajeId, usuarioId);
      return tieneDeuda;
    });
  }
}
