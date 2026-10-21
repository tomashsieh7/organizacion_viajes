import type { AlojamientoVista, EstadoPropuesta } from '@viajes/compartido';
import type { RangoFechas } from '../../../comun/valores/rangoFechas.js';
import type { Propuesta } from '../../propuestas/dominio/propuesta.js';

export interface DetalleAlojamiento {
  nombre: string;
  estadia: RangoFechas;
}

/** De qué viaje y de quién es una propuesta ya guardada, para reconocer un reintento. */
export interface OrigenDePropuesta {
  viajeId: string;
  autorId: string;
  tipo: 'ALOJAMIENTO' | 'ACTIVIDAD';
}

export interface RepositorioAlojamientos {
  /**
   * Guarda la propuesta base y los datos propios del alojamiento. Lanza CONFLICTO
   * `PROPUESTA_EXISTENTE` si ya hay una propuesta con ese id.
   */
  crear(propuesta: Propuesta, detalle: DetalleAlojamiento): Promise<void>;
  origen(propuestaId: string): Promise<OrigenDePropuesta | null>;
}

export interface ReposAlojamientos {
  alojamientos: RepositorioAlojamientos;
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
