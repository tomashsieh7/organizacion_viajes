import type { PublicadorDeEventos } from '../../../comun/eventos.js';
import type { Reloj } from '../../../comun/reloj.js';
import type { UnidadDeTrabajo } from '../../../comun/unidadDeTrabajo.js';
import type { ReposViajes } from '../dominio/puertos.js';

/** Dependencias comunes de los casos de uso que modifican un viaje. */
export interface DependenciasViajes {
  unidad: UnidadDeTrabajo<ReposViajes>;
  eventos: PublicadorDeEventos;
  reloj: Reloj;
}
