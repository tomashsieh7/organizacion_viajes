import type { ReglaAlResolver } from '../../propuestas/dominio/puertos.js';
import type { ReposResolucionConActividades } from '../dominio/puertos.js';

export type Contexto = Parameters<ReglaAlResolver<ReposResolucionConActividades>['alResolver']>[0];

export const esConfirmacionDeActividad = (c: Contexto) =>
  c.accion === 'confirmar' && c.propuesta.tipo === 'ACTIVIDAD';
