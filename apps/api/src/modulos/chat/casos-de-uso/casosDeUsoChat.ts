import { randomUUID } from 'node:crypto';
import type { MensajeVista, PaginaDeMensajes } from '@viajes/compartido';
import { ErrorDeDominio } from '../../../compartido/errores.js';
import type { BusDeEventos } from '../../../compartido/eventos.js';
import type { Reloj } from '../../../compartido/reloj.js';
import type { AdministracionTransferida, MiembroDadoDeBaja } from '../../viajes/dominio/eventos.js';
import { Mensaje } from '../dominio/mensaje.js';
import type {
  ConsultaMensajes,
  ConsultaParticipacion,
  ConsultaSaldosPendientes,
  NotificadorViaje,
  RepositorioMensajes,
} from '../dominio/puertos.js';

async function exigirParticipante(
  participacion: ConsultaParticipacion,
  viajeId: string,
  usuarioId: string,
) {
  if (!(await participacion.esParticipanteActivo(viajeId, usuarioId))) {
    throw new ErrorDeDominio('PROHIBIDO', 'NO_PARTICIPANTE', 'No participás de este viaje');
  }
}

/** `chat:unirse`: solo los participantes activos entran a la sala del viaje (RN-X1). */
export class UnirseAlChat {
  constructor(private readonly participacion: ConsultaParticipacion) {}

  ejecutar(viajeId: string, usuarioId: string): Promise<void> {
    return exigirParticipante(this.participacion, viajeId, usuarioId);
  }
}

/** CU19 y RN-X5: guarda el mensaje de un participante activo y devuelve su vista. */
export class EnviarMensaje {
  constructor(
    private readonly participacion: ConsultaParticipacion,
    private readonly mensajes: RepositorioMensajes,
    private readonly consultas: ConsultaMensajes,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(viajeId: string, autorId: string, contenido: string): Promise<MensajeVista> {
    await exigirParticipante(this.participacion, viajeId, autorId);
    const mensaje = Mensaje.escribir({
      id: randomUUID(),
      viajeId,
      autorId,
      contenido,
      ahora: this.reloj.ahora(),
    });
    await this.mensajes.guardar(mensaje);
    const vista = await this.consultas.obtener(viajeId, mensaje.id);
    if (!vista) throw new Error('El mensaje recién guardado no se encontró');
    return vista;
  }
}

/** CU19: historial del chat, paginado hacia atrás. */
export class ConsultarMensajes {
  constructor(private readonly consultas: ConsultaMensajes) {}

  async pagina(
    viajeId: string,
    antesDe: string | undefined,
    limite: number,
  ): Promise<PaginaDeMensajes> {
    const pagina = await this.consultas.pagina(viajeId, antesDe, limite);
    if (!pagina) throw new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'El mensaje no existe');
    return pagina;
  }
}

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
