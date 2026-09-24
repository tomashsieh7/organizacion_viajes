import type {
  AvisoAdminCambiado,
  AvisoMembresiaFinalizada,
  MensajeVista,
  PaginaDeMensajes,
} from '@viajes/compartido';
import type { Mensaje } from './mensaje.js';

export interface RepositorioMensajes {
  guardar(mensaje: Mensaje): Promise<void>;
}

export interface ConsultaMensajes {
  obtener(viajeId: string, mensajeId: string): Promise<MensajeVista | null>;
  /**
   * Hasta `limite` mensajes anteriores a `antesDe` (o los últimos, si no se indica), en orden
   * cronológico. Devuelve null si `antesDe` no es un mensaje del viaje.
   */
  pagina(
    viajeId: string,
    antesDe: string | undefined,
    limite: number,
  ): Promise<PaginaDeMensajes | null>;
}

/** RN-X1 y RN-X5: si el usuario participa del viaje con membresía activa. */
export interface ConsultaParticipacion {
  esParticipanteActivo(viajeId: string, usuarioId: string): Promise<boolean>;
}

/**
 * Entrega en tiempo real los cambios del viaje a quienes están conectados (fabricación pura:
 * el dominio de viajes no conoce la mensajería).
 */
export interface NotificadorViaje {
  /** Avisa al usuario en todas sus conexiones y deja de enviarle los mensajes del viaje (RN-E4). */
  membresiaFinalizada(usuarioId: string, aviso: AvisoMembresiaFinalizada): Promise<void>;
  /** Avisa a quienes están en el chat del viaje. */
  adminCambiado(aviso: AvisoAdminCambiado): Promise<void>;
}
