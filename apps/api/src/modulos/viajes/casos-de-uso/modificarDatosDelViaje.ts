import { elegirPlan, type DatosViaje, type Reacomodo } from '@viajes/compartido';
import { aplicarPlan } from '../dominio/reacomodo.js';
import type { DependenciasViajes } from './dependencias.js';
import { modificarViaje } from './modificarViaje.js';

/**
 * CU27: el Admin cambia los datos del viaje y, si cambian las fechas, las propuestas se reacomodan
 * en la misma transacción (RN-V2). El viaje queda bloqueado, así ninguna propuesta nueva se cuela
 * con las fechas viejas mientras tanto (RN-V4).
 */
export class ModificarDatosDelViaje {
  constructor(private readonly deps: DependenciasViajes) {}

  async ejecutar(viajeId: string, solicitanteId: string, datos: DatosViaje): Promise<Reacomodo> {
    return modificarViaje(this.deps, viajeId, async (viaje, repos) => {
      const antes = viaje.rango;
      viaje.modificarDatos(solicitanteId, datos);
      const despues = viaje.rango;
      if (antes.desde === despues.desde && antes.hasta === despues.hasta) {
        return { semanas: 0, movidas: 0 };
      }
      const propuestas = await repos.agenda.propuestas(viajeId);
      const enJuego = propuestas.filter((p) => p.propuesta.sigueEnJuego);
      const elegido = elegirPlan(
        antes,
        despues,
        enJuego.map((p) => p.dias),
      );
      // RN-V3: sin plan automático, no mover nada deja algo afuera y aplicarPlan lo informa.
      const movidas = aplicarPlan(elegido?.plan ?? {}, propuestas, despues);
      await repos.agenda.guardar(movidas);
      return { semanas: elegido?.semanas ?? 0, movidas: movidas.length };
    });
  }
}
