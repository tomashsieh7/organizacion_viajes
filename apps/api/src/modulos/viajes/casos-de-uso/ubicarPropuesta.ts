import { esquemaFecha } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import { exigirAgendaSinConflictos } from '../dominio/reacomodo.js';
import type { DependenciasViajes } from './dependencias.js';
import { modificarViaje } from './modificarViaje.js';

/** CU28, RN-V7: la ubicación comparte el bloqueo y la agenda usados al modificar el viaje. */
export class UbicarPropuesta {
  constructor(private readonly deps: DependenciasViajes) {}

  async ejecutar(
    viajeId: string,
    usuarioId: string,
    id: string,
    tipo: 'ACTIVIDAD' | 'ALOJAMIENTO',
    fecha: string,
  ): Promise<void> {
    if (!esquemaFecha.safeParse(fecha).success)
      throw new ErrorDeDominio('VALIDACION', 'FECHA_INVALIDA', 'Elegí una fecha válida');
    await modificarViaje(this.deps, viajeId, async (viaje, repos) => {
      if (!viaje.esAdmin(usuarioId))
        throw new ErrorDeDominio(
          'PROHIBIDO',
          'SOLO_ADMIN',
          'Solo el Admin del viaje puede hacer esto',
        );
      const propuestas = await repos.agenda.propuestas(viajeId);
      const p = propuestas.find((p) => p.id === id && p.propuesta.tipo === tipo);
      if (!p) throw new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'La propuesta no existe');
      if (!p.propuesta.sigueEnJuego)
        throw new ErrorDeDominio('CONFLICTO', 'PROPUESTA_FINAL', 'La propuesta ya fue descartada');
      p.ubicar(fecha, this.deps.reloj.ahora());
      if (!p.dias || !viaje.rango.contiene(p.dias.desde) || !viaje.rango.contiene(p.dias.hasta))
        throw new ErrorDeDominio(
          'REGLA_DE_NEGOCIO',
          'FUERA_DEL_VIAJE',
          'La propuesta tiene que entrar completa en el viaje',
        );
      exigirAgendaSinConflictos(propuestas);
      const intervalo = p.intervaloAgendado;
      const conflictos = intervalo
        ? propuestas.filter(
            (a) =>
              a.id !== p.id &&
              a.propuesta.estado === 'CONFIRMADA' &&
              a.intervaloAgendado?.seSuperponeCon(intervalo),
          )
        : [];
      if (conflictos.length)
        throw new ErrorDeDominio(
          'CONFLICTO',
          'SUPERPOSICION_HORARIA',
          `Se superponen: ${[p, ...conflictos].map((a) => a.titulo).join(', ')}.`,
          { conflictos: conflictos.map((a) => ({ id: a.id, titulo: a.titulo })) },
        );
      await repos.agenda.guardar([p]);
    });
  }
}
