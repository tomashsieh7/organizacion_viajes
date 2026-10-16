import type { DatosActividadNueva } from '@viajes/compartido';
import { Actividad } from '../dominio/actividad.js';
import type { DependenciasProponerActividad } from './dependencias.js';
import { datosDeActividad, exigirFechaDelViaje, exigirSinSuperposicion } from './verificaciones.js';

/** CU10. */
export class ProponerActividad {
  constructor(private readonly deps: DependenciasProponerActividad) {}

  async ejecutar(viajeId: string, autorId: string, datos: DatosActividadNueva): Promise<string> {
    await exigirFechaDelViaje(this.deps.fechas, viajeId, datos.fecha);
    const actividad = Actividad.proponer({
      ...datosDeActividad(autorId, datos, this.deps.reloj.ahora()),
      viajeId,
    });
    await this.deps.unidad.ejecutar(async (repos) => {
      await exigirSinSuperposicion(repos, actividad);
      await repos.actividades.crear(actividad);
    });
    return actividad.id;
  }
}
