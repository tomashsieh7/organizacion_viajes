import type { Reloj } from '../../../comun/reloj.js';
import type { UnidadDeTrabajo } from '../../../comun/unidadDeTrabajo.js';
import type { ConsultaOrigenesDePropuestas } from '../../propuestas/dominio/puertos.js';
import type { ReposProponerActividad } from '../dominio/puertos.js';

/** Dependencias comunes para proponer actividades y alternativas. */
export interface DependenciasProponerActividad {
  unidad: UnidadDeTrabajo<ReposProponerActividad>;
  reloj: Reloj;
  origenes: ConsultaOrigenesDePropuestas;
}
