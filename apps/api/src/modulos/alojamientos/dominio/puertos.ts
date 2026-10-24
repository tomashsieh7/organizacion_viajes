import type { AlojamientoVista, EstadoPropuesta } from '@viajes/compartido';
import type { RangoFechas } from '../../../comun/valores/rangoFechas.js';
import type { Propuesta } from '../../propuestas/dominio/propuesta.js';
import type { ConsultaFechasDeViaje } from '../../propuestas/dominio/puertos.js';

export interface DetalleAlojamiento {
  nombre: string;
  estadia: RangoFechas | null;
  noches?: number;
  fechaCambiadaEn?: Date | null;
}

export interface RepositorioAlojamientos {
  /**
   * Guarda la propuesta base y los datos propios del alojamiento. Lanza CONFLICTO
   * `PROPUESTA_EXISTENTE` si ya hay una propuesta con ese id.
   */
  crear(propuesta: Propuesta, detalle: DetalleAlojamiento): Promise<void>;
}

export interface ReposAlojamientos {
  alojamientos: RepositorioAlojamientos;
  fechas: ConsultaFechasDeViaje;
}

export interface ConsultaAlojamientos {
  /** Alojamientos del viaje ordenados por fecha de entrada, con conteo de votos y voto propio. */
  listar(viajeId: string, usuarioId: string, estado?: EstadoPropuesta): Promise<AlojamientoVista[]>;
  obtener(
    viajeId: string,
    propuestaId: string,
    usuarioId: string,
  ): Promise<AlojamientoVista | null>;
}
