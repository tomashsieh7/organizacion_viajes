import type { DatosActividadNueva } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import type { DependenciasProponerActividad } from './dependencias.js';
import { datosDeActividad, exigirFechaDelViaje, exigirSinSuperposicion } from './verificaciones.js';

/** CU11. */
export class ProponerAlternativa {
  constructor(private readonly deps: DependenciasProponerActividad) {}

  async ejecutar(
    viajeId: string,
    actividadId: string,
    autorId: string,
    datos: DatosActividadNueva,
  ): Promise<string> {
    await exigirFechaDelViaje(this.deps.fechas, viajeId, datos.fecha);
    return this.deps.unidad.ejecutar(async (repos) => {
      const elegida = await repos.actividades.obtenerParaModificar(viajeId, actividadId);
      if (!elegida)
        throw new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'La actividad no existe');
      const alternativa = elegida.crearAlternativa(
        datosDeActividad(autorId, datos, this.deps.reloj.ahora()),
      );
      await exigirSinSuperposicion(repos, alternativa);
      await repos.actividades.crear(alternativa);
      return alternativa.id;
    });
  }
}
