import { randomUUID } from 'node:crypto';
import type { ConflictoHorario, DatosActividadNueva } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import { Coordenadas } from '../../../comun/valores/coordenadas.js';
import type { ConsultaFechasDeViaje } from '../../propuestas/dominio/puertos.js';
import { Actividad, type DatosNuevaActividad } from '../dominio/actividad.js';
import { conflictosDeHorario, type ActividadAgendada } from '../dominio/politicas.js';
import type { ReposActividades } from '../dominio/puertos.js';

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

/** RN-V4: llamar dentro de la transacción en la que se guarda la actividad. */
export async function exigirFechaDelViaje(
  fechas: ConsultaFechasDeViaje,
  viajeId: string,
  fecha: string,
) {
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

export function datosDeActividad(
  autorId: string,
  datos: DatosActividadNueva,
  ahora: Date,
): Omit<DatosNuevaActividad, 'viajeId'> {
  return {
    id: datos.id ?? randomUUID(),
    autorId,
    titulo: datos.titulo,
    descripcion: datos.descripcion ?? '',
    ubicacion: datos.ubicacion,
    coordenadas: Coordenadas.crear(datos.latitud, datos.longitud),
    precio: datos.precio,
    fecha: datos.fecha,
    horaInicio: datos.horaInicio,
    duracionMin: datos.duracionMin,
    ahora,
  };
}

/**
 * RN-A2: si choca con alguna confirmada, no se guarda. Llamar después de `compartirAgenda`, para
 * no pasar por alto una confirmación simultánea.
 */
export async function exigirSinSuperposicion(repos: ReposActividades, actividad: Actividad) {
  const conflictos = conflictosDeHorario(
    { id: actividad.id, intervalo: actividad.intervalo },
    await repos.actividades.confirmadas(actividad.propuesta.viajeId),
  );
  if (conflictos.length > 0) throw errorDeSuperposicion(conflictos);
}
