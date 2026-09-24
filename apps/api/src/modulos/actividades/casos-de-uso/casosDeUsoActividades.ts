import { randomUUID } from 'node:crypto';
import type {
  ActividadVista,
  ConflictoHorario,
  DatosActividadNueva,
  EstadoPropuesta,
} from '@viajes/compartido';
import { ErrorDeDominio } from '../../../compartido/errores.js';
import type { Reloj } from '../../../compartido/reloj.js';
import type { UnidadDeTrabajo } from '../../../compartido/unidadDeTrabajo.js';
import { Coordenadas } from '../../../compartido/valores/coordenadas.js';
import type { ConsultaFechasDeViaje } from '../../propuestas/dominio/puertos.js';
import { Actividad, type DatosNuevaActividad } from '../dominio/actividad.js';
import type { ActividadAgendada, PoliticaSuperposicion } from '../dominio/politicas.js';
import type { ConsultaActividades, ReposActividades } from '../dominio/puertos.js';

/** Error de RN-A2 con las actividades confirmadas que chocan. */
export function errorDeSuperposicion(conflictos: ActividadAgendada[]): ErrorDeDominio {
  const detalle: ConflictoHorario[] = conflictos.map(({ intervalo: _i, ...c }) => c);
  return new ErrorDeDominio(
    'CONFLICTO',
    'SUPERPOSICION_HORARIA',
    'El horario se superpone con una actividad ya confirmada',
    { conflictos: detalle },
  );
}

/** Dependencias comunes para proponer actividades y alternativas. */
export interface DependenciasProponerActividad {
  unidad: UnidadDeTrabajo<ReposActividades>;
  fechas: ConsultaFechasDeViaje;
  superposicion: PoliticaSuperposicion;
  reloj: Reloj;
}

async function exigirFechaDelViaje(fechas: ConsultaFechasDeViaje, viajeId: string, fecha: string) {
  const viaje = await fechas.rango(viajeId);
  if (!viaje) throw new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'El viaje no existe');
  // RN-X4 (P11): de la actividad se controla el día de inicio.
  if (!viaje.contiene(fecha)) {
    throw new ErrorDeDominio(
      'REGLA_DE_NEGOCIO',
      'FUERA_DEL_VIAJE',
      `La fecha tiene que estar entre el ${viaje.desde} y el ${viaje.hasta}`,
      { desde: viaje.desde, hasta: viaje.hasta },
    );
  }
}

function datosDeActividad(
  autorId: string,
  datos: DatosActividadNueva,
  ahora: Date,
): Omit<DatosNuevaActividad, 'viajeId'> {
  return {
    id: randomUUID(),
    autorId,
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    ubicacion: datos.ubicacion,
    coordenadas: Coordenadas.crear(datos.latitud, datos.longitud),
    precio: datos.precio,
    fecha: datos.fecha,
    horaInicio: datos.horaInicio,
    duracionMin: datos.duracionMin,
    ahora,
  };
}

/** RN-A2: si choca con alguna confirmada, no se guarda. */
async function exigirSinSuperposicion(
  deps: DependenciasProponerActividad,
  repos: ReposActividades,
  actividad: Actividad,
) {
  const conflictos = deps.superposicion.conflictos(
    { id: actividad.id, intervalo: actividad.intervalo },
    await repos.actividades.confirmadas(actividad.propuesta.viajeId),
  );
  if (conflictos.length > 0) throw errorDeSuperposicion(conflictos);
}

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
      await exigirSinSuperposicion(this.deps, repos, actividad);
      await repos.actividades.crear(actividad);
    });
    return actividad.id;
  }
}

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
      await exigirSinSuperposicion(this.deps, repos, alternativa);
      await repos.actividades.crear(alternativa);
      return alternativa.id;
    });
  }
}

/** Listado y CU18. */
export class ConsultarActividades {
  constructor(private readonly consultas: ConsultaActividades) {}

  listar(viajeId: string, usuarioId: string, estado?: EstadoPropuesta): Promise<ActividadVista[]> {
    return this.consultas.listar(viajeId, usuarioId, estado);
  }

  async obtener(viajeId: string, actividadId: string, usuarioId: string): Promise<ActividadVista> {
    const a = await this.consultas.obtener(viajeId, actividadId, usuarioId);
    if (!a) throw new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'La actividad no existe');
    return a;
  }
}
