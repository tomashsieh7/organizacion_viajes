import type { DatosActividadNueva } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import { proponerUnaVez } from '../../propuestas/casos-de-uso/proponerUnaVez.js';
import type { DependenciasProponerActividad } from './dependencias.js';
import { datosDeActividad, exigirFechaDelViaje, exigirSinSuperposicion } from './verificaciones.js';

/** CU11. Si el mismo formulario reintenta, devuelve la alternativa ya creada. */
export class ProponerAlternativa {
  constructor(private readonly deps: DependenciasProponerActividad) {}

  async ejecutar(
    viajeId: string,
    actividadId: string,
    autorId: string,
    datos: DatosActividadNueva,
  ): Promise<string> {
    const nueva = datosDeActividad(autorId, datos, this.deps.reloj.ahora());
    await proponerUnaVez(
      this.deps.origenes,
      { id: nueva.id, viajeId, autorId, tipo: 'ACTIVIDAD' },
      () =>
        this.deps.unidad.ejecutar(async (repos) => {
          // La agenda primero y después la actividad elegida, en el mismo orden que la resolución.
          await repos.actividades.compartirAgenda(viajeId);
          await exigirFechaDelViaje(repos.fechas, viajeId, datos.fecha);
          const elegida = await repos.actividades.obtenerParaModificar(viajeId, actividadId);
          if (!elegida)
            throw new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'La actividad no existe');
          const alternativa = elegida.crearAlternativa(nueva);
          await exigirSinSuperposicion(repos, alternativa);
          await repos.actividades.crear(alternativa);
        }),
    );
    return nueva.id;
  }
}
