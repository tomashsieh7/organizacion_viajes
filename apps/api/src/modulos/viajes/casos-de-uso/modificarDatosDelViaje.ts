import { planDiasQueQuedan, elegirPlan, type DatosViaje, type Reacomodo } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
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
      if (
        datos.eleccion &&
        (datos.eleccion.antes.desde !== antes.desde || datos.eleccion.antes.hasta !== antes.hasta)
      )
        throw new ErrorDeDominio(
          'CONFLICTO',
          'VIAJE_MODIFICADO',
          'Las fechas cambiaron. Volvé a abrir los datos del viaje',
        );
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
        enJuego.flatMap((p) => (p.dias ? [p.dias] : [])),
      );
      // RN-V3: sin plan automático, no mover nada deja algo afuera y aplicarPlan lo informa.
      const manual = datos.eleccion
        ? planDiasQueQuedan(antes, despues, datos.eleccion.dias)
        : undefined;
      if (datos.eleccion && !manual)
        throw new ErrorDeDominio(
          'VALIDACION',
          'PLAN_INVALIDO',
          'Revisá los días elegidos: no pueden repetirse ni quedar fuera del viaje',
        );
      const movidas = aplicarPlan(
        manual ?? elegido?.plan ?? {},
        propuestas,
        despues,
        !!manual,
        this.deps.reloj.ahora(),
      );
      await repos.agenda.guardar(movidas);
      return {
        semanas: manual ? 0 : (elegido?.semanas ?? 0),
        movidas: movidas.length,
        ...(manual ? { sinDia: enJuego.filter((p) => p.dias === null).length } : {}),
      };
    });
  }
}
