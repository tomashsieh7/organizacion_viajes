import type { EventoDeDominio } from '../../../comun/eventos.js';

/** RN-S5: se cerró una sesión; quien tenga conexiones abiertas con ella las tiene que cortar. */
export interface SesionCerrada extends EventoDeDominio {
  readonly tipo: 'auth.sesion-cerrada';
  readonly tokenHash: string;
}
