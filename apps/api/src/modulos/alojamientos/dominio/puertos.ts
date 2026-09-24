import type { AlojamientoVista, EstadoPropuesta } from '@viajes/compartido';
import type { RangoFechas } from '../../../compartido/valores/rangoFechas.js';
import type { Propuesta } from '../../propuestas/dominio/propuesta.js';

export interface DetalleAlojamiento {
  nombre: string;
  estadia: RangoFechas;
}

export interface RepositorioAlojamientos {
  /** Guarda la propuesta base y los datos propios del alojamiento. */
  crear(propuesta: Propuesta, detalle: DetalleAlojamiento): Promise<void>;
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
