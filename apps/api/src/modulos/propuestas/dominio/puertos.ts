import type { AccionSobrePropuesta, PropuestaVista } from '@viajes/compartido';
import type { RangoFechas } from '../../../compartido/valores/rangoFechas.js';
import type { LectorDeViajes } from '../../viajes/dominio/puertos.js';
import type { Propuesta } from './propuesta.js';

export interface RepositorioPropuestas {
  /** Carga la propuesta del viaje, bloqueada hasta el fin de la transacción; null si no existe en ese viaje. */
  obtenerParaModificar(viajeId: string, propuestaId: string): Promise<Propuesta | null>;
  /** Inserta o actualiza la propuesta base y sincroniza sus votos. */
  guardar(propuesta: Propuesta): Promise<void>;
}

/** Repositorios mínimos de una transacción de propuestas; las reglas de cada tipo los amplían. */
export interface ReposPropuestas {
  propuestas: RepositorioPropuestas;
  /**
   * Lee el viaje y lo bloquea antes que la propuesta, para que una baja o un traspaso simultáneos
   * esperen y la participación o el rol se verifiquen sobre el estado vigente (D18, RN-E5).
   */
  viajes: LectorDeViajes;
}

/**
 * Punto de extensión de la resolución (abierto/cerrado): cada regla se ejecuta dentro de la
 * transacción después de aplicar la transición, puede rechazarla lanzando un error y devuelve los
 * ids de otras propuestas que modificó. Las actividades suman las reglas de superposición y de opciones.
 */
export interface ReglaAlResolver<R extends ReposPropuestas> {
  alResolver(contexto: {
    propuesta: Propuesta;
    accion: AccionSobrePropuesta;
    adminId: string;
    ahora: Date;
    repos: R;
  }): Promise<string[]>;
}

/** Vista común de una propuesta, para responder después de votar o resolver. */
export interface ConsultaPropuestas {
  obtenerVista(
    viajeId: string,
    propuestaId: string,
    usuarioId: string,
  ): Promise<PropuestaVista | null>;
}

/** Fechas del viaje, para validar que lo propuesto caiga dentro de él (P11). */
export interface ConsultaFechasDeViaje {
  rango(viajeId: string): Promise<RangoFechas | null>;
}
