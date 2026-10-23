import type { DatosActividadNueva } from '@viajes/compartido';
import { proponerUnaVez } from '../../propuestas/casos-de-uso/proponerUnaVez.js';
import { Actividad } from '../dominio/actividad.js';
import type { DependenciasProponerActividad } from './dependencias.js';
import { datosDeActividad, exigirFechaDelViaje, exigirSinSuperposicion } from './verificaciones.js';

/** CU10. Si el mismo formulario reintenta, devuelve la actividad ya creada. */
export class ProponerActividad {
  constructor(private readonly deps: DependenciasProponerActividad) {}

  async ejecutar(viajeId: string, autorId: string, datos: DatosActividadNueva): Promise<string> {
    const actividad = Actividad.proponer({
      ...datosDeActividad(autorId, datos, this.deps.reloj.ahora()),
      viajeId,
    });
    await proponerUnaVez(
      this.deps.origenes,
      { id: actividad.id, viajeId, autorId, tipo: 'ACTIVIDAD' },
      () =>
        this.deps.unidad.ejecutar(async (repos) => {
          await repos.actividades.compartirAgenda(viajeId);
          await exigirFechaDelViaje(repos.fechas, viajeId, datos.fecha);
          await exigirSinSuperposicion(repos, actividad);
          await repos.actividades.crear(actividad);
        }),
    );
    return actividad.id;
  }
}
