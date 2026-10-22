import type { Reloj } from '../../../comun/reloj.js';
import type { UnidadDeTrabajo } from '../../../comun/unidadDeTrabajo.js';
import type {
  ConsultaFechasDeViaje,
  ConsultaOrigenesDePropuestas,
} from '../../propuestas/dominio/puertos.js';
import type { ReposActividades } from '../dominio/puertos.js';

/** Dependencias comunes para proponer actividades y alternativas. */
export interface DependenciasProponerActividad {
  unidad: UnidadDeTrabajo<ReposActividades>;
  fechas: ConsultaFechasDeViaje;
  reloj: Reloj;
  origenes: ConsultaOrigenesDePropuestas;
}
