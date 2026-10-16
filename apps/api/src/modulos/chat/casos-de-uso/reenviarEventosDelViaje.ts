import type { BusDeEventos } from '../../../comun/eventos.js';
import type { AdministracionTransferida, MiembroDadoDeBaja } from '../../viajes/dominio/eventos.js';
import type { ConsultaSaldosPendientes } from '../../viajes/dominio/puertos.js';
import type { NotificadorViaje } from '../dominio/puertos.js';

/**
 * Observer (sección 2.2.3 de PLAN.md): se suscribe a los eventos de dominio de baja y de traspaso
 * que publica el módulo de viajes y los entrega por el notificador.
 */
export class ReenviarEventosDelViaje {
  constructor(private readonly saldos: ConsultaSaldosPendientes) {}

  suscribir(bus: BusDeEventos, notificador: NotificadorViaje): void {
    bus.suscribir<MiembroDadoDeBaja>('viaje.miembro-dado-de-baja', async (e) => {
      await notificador.membresiaFinalizada(e.usuarioId, {
        viajeId: e.viajeId,
        motivo: e.motivo,
        conservaAccesoSaldos: await this.saldos.tieneSaldosPendientes(e.viajeId, e.usuarioId),
      });
    });
    bus.suscribir<AdministracionTransferida>('viaje.administracion-transferida', (e) =>
      notificador.adminCambiado({
        viajeId: e.viajeId,
        nuevoAdminId: e.nuevoAdminId,
        anteriorAdminId: e.anteriorAdminId,
      }),
    );
  }
}
