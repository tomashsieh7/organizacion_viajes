import type { ActividadVista, EstadoPropuesta } from '@viajes/compartido';
import type { ConsultaFechasDeViaje, ReposPropuestas } from '../../propuestas/dominio/puertos.js';
import type { Actividad } from './actividad.js';
import type { ActividadAgendada } from './politicas.js';

export interface RepositorioActividades {
  /** Lanza CONFLICTO `PROPUESTA_EXISTENTE` si ya hay una propuesta con ese id. */
  crear(actividad: Actividad): Promise<void>;
  /** Carga una actividad del viaje bloqueada hasta el fin de la transacción; null si no existe. */
  obtenerParaModificar(viajeId: string, actividadId: string): Promise<Actividad | null>;
  /** Actividades confirmadas del viaje. */
  confirmadas(viajeId: string): Promise<ActividadAgendada[]>;
  /** La original y sus alternativas, bloqueadas hasta el fin de la transacción. */
  opcionesDelGrupo(viajeId: string, grupoId: string): Promise<Actividad[]>;
  /**
   * Bloquea la agenda del viaje hasta el fin de la transacción, para que dos confirmaciones
   * simultáneas no dejen actividades superpuestas.
   */
  bloquearAgenda(viajeId: string): Promise<void>;
  /**
   * RN-A2: bloqueo compartido de la agenda para proponer. Espera a que termine una confirmación en
   * curso, así el control de superposición ve la agenda actualizada, pero no frena a otras
   * propuestas simultáneas.
   */
  compartirAgenda(viajeId: string): Promise<void>;
}

export interface ReposActividades {
  actividades: RepositorioActividades;
}

/** Repositorios de la transacción de proponer actividades y alternativas. */
export interface ReposProponerActividad extends ReposActividades {
  fechas: ConsultaFechasDeViaje;
}

/** Repositorios de la transacción de resolución cuando se suman las reglas de actividades. */
export type ReposResolucionConActividades = ReposPropuestas & ReposActividades;

export interface ConsultaActividades {
  /** Actividades del viaje ordenadas por fecha y hora, originales y alternativas. */
  listar(viajeId: string, usuarioId: string, estado?: EstadoPropuesta): Promise<ActividadVista[]>;
  obtener(viajeId: string, actividadId: string, usuarioId: string): Promise<ActividadVista | null>;
}
