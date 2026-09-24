import type { EventoDeDominio } from '../../../compartido/eventos.js';

export interface MiembroDadoDeBaja extends EventoDeDominio {
  readonly tipo: 'viaje.miembro-dado-de-baja';
  readonly viajeId: string;
  readonly usuarioId: string;
  readonly motivo: 'ELIMINADO' | 'RETIRADO';
  readonly bajaConDeuda: boolean;
}

export interface AdministracionTransferida extends EventoDeDominio {
  readonly tipo: 'viaje.administracion-transferida';
  readonly viajeId: string;
  readonly anteriorAdminId: string;
  readonly nuevoAdminId: string;
}

export type EventoDeViaje = MiembroDadoDeBaja | AdministracionTransferida;
