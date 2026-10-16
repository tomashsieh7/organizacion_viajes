import type { AvisoAdminCambiado, AvisoMembresiaFinalizada } from '@viajes/compartido';
import type { NotificadorViaje } from '../dominio/puertos.js';
import { type EspacioChat, salaDelUsuario, salaDelViaje } from './gatewayChat.js';

/** `NotificadorViaje` sobre Socket.IO: salas por usuario y por viaje. */
export class NotificadorViajeSocketIO implements NotificadorViaje {
  constructor(private readonly espacio: EspacioChat) {}

  async membresiaFinalizada(usuarioId: string, aviso: AvisoMembresiaFinalizada): Promise<void> {
    const conexiones = this.espacio.in(salaDelUsuario(usuarioId));
    conexiones.socketsLeave(salaDelViaje(aviso.viajeId));
    conexiones.emit('viaje:membresia-finalizada', aviso);
  }

  async adminCambiado(aviso: AvisoAdminCambiado): Promise<void> {
    this.espacio.to(salaDelViaje(aviso.viajeId)).emit('viaje:admin-cambiado', aviso);
  }
}
