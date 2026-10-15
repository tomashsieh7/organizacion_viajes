import type { InjectionKey } from 'vue';
import { io, type Socket } from 'socket.io-client';
import type {
  AvisoAdminCambiado,
  AvisoMembresiaFinalizada,
  ConfirmacionSocket,
  DatosMensajeNuevo,
  EventosClienteChat,
  EventosServidorChat,
  AvisoEscribiendo,
  MensajeVista,
  PaginaDeMensajes,
  ReaccionesDelMensaje,
  ReaccionVista,
} from '@viajes/compartido';
import { avisarSiSePerdioLaSesion, ErrorDeApi, pedir } from './http';

/** Lo que el chat avisa en tiempo real. */
export interface OyentesChat {
  mensaje(m: MensajeVista): void;
  membresiaFinalizada(aviso: AvisoMembresiaFinalizada): void;
  adminCambiado(aviso: AvisoAdminCambiado): void;
  reacciones(datos: ReaccionesDelMensaje): void;
  escribiendo(aviso: AvisoEscribiendo): void;
  /** La conexión se recuperó después de cortarse; puede haber mensajes que no llegaron. */
  reconectado(): void;
}

export interface ConexionChat {
  unirse(viajeId: string): Promise<void>;
  salir(viajeId: string): void;
  enviar(datos: DatosMensajeNuevo): Promise<MensajeVista>;
  /** Con `emoji: null` quita la reacción propia; devuelve cómo quedaron las del mensaje. */
  reaccionar(datos: {
    viajeId: string;
    mensajeId: string;
    emoji: string | null;
  }): Promise<ReaccionVista[]>;
  /** Aviso sin confirmación: si se pierde, el próximo lo reemplaza. */
  escribiendo(viajeId: string): void;
  cerrar(): void;
}

export interface ClienteChat {
  historial(viajeId: string, antesDe?: string): Promise<PaginaDeMensajes>;
  /** Lo que llegó hasta ahora deja de contar como sin leer en la lista de grupos. */
  marcarLeido(viajeId: string): Promise<void>;
  conectar(oyentes: OyentesChat): ConexionChat;
}

export const CLIENTE_CHAT: InjectionKey<ClienteChat> = Symbol('ClienteChat');

const ESPERA_MAXIMA_MS = 10_000;

/**
 * Espera la confirmación del servidor y traduce una negativa al mismo error que usa la API HTTP.
 * Si no llega a tiempo (por ejemplo, sin conexión), falla con SIN_CONEXION.
 */
async function confirmacion<T extends object>(pedido: Promise<ConfirmacionSocket<T>>): Promise<T> {
  let r: ConfirmacionSocket<T>;
  try {
    r = await pedido;
  } catch {
    throw new ErrorDeApi(0, 'SIN_CONEXION', 'No se pudo conectar con el chat');
  }
  if (!r.ok) {
    avisarSiSePerdioLaSesion(r.error.codigo);
    throw new ErrorDeApi(0, r.error.codigo, r.error.mensaje);
  }
  return r;
}

class ConexionSocketIO implements ConexionChat {
  /** Viajes a los que hay que volver a unirse si la conexión se corta y se recupera. */
  private readonly viajes = new Set<string>();

  constructor(
    private readonly socket: Socket<EventosServidorChat, EventosClienteChat>,
    oyentes: OyentesChat,
  ) {
    socket.on('chat:mensaje', (m) => oyentes.mensaje(m));
    socket.on('viaje:membresia-finalizada', (a) => {
      this.viajes.delete(a.viajeId);
      oyentes.membresiaFinalizada(a);
    });
    socket.on('viaje:admin-cambiado', (a) => oyentes.adminCambiado(a));
    socket.on('chat:reacciones', (d) => oyentes.reacciones(d));
    socket.on('chat:escribiendo', (a) => oyentes.escribiendo(a));
    socket.io.on('reconnect', async () => {
      for (const v of this.viajes) await this.unirse(v).catch(() => this.viajes.delete(v));
      oyentes.reconectado();
    });
  }

  async unirse(viajeId: string) {
    await confirmacion(
      this.socket.timeout(ESPERA_MAXIMA_MS).emitWithAck('chat:unirse', { viajeId }),
    );
    this.viajes.add(viajeId);
  }

  salir(viajeId: string) {
    this.viajes.delete(viajeId);
    this.socket.emit('chat:salir', { viajeId });
  }

  async enviar(datos: DatosMensajeNuevo) {
    return (
      await confirmacion(this.socket.timeout(ESPERA_MAXIMA_MS).emitWithAck('chat:enviar', datos))
    ).mensaje;
  }

  async reaccionar(datos: { viajeId: string; mensajeId: string; emoji: string | null }) {
    return (
      await confirmacion(
        this.socket.timeout(ESPERA_MAXIMA_MS).emitWithAck('chat:reaccionar', datos),
      )
    ).reacciones;
  }

  escribiendo(viajeId: string) {
    this.socket.emit('chat:escribiendo', { viajeId });
  }

  cerrar() {
    this.socket.disconnect();
  }
}

export class ClienteChatSocketIO implements ClienteChat {
  async historial(viajeId: string, antesDe?: string) {
    const q = antesDe ? `?antesDe=${antesDe}` : '';
    return pedir<PaginaDeMensajes>('GET', `/api/viajes/${viajeId}/mensajes${q}`);
  }

  async marcarLeido(viajeId: string) {
    await pedir<void>('PUT', `/api/viajes/${viajeId}/mensajes/leidos`);
  }

  conectar(oyentes: OyentesChat): ConexionChat {
    // Mismo origen que la web: la cookie de sesión viaja en el handshake (D6, D11).
    // Solo WebSocket, como el servidor: su handshake lleva el Origin que el servidor verifica.
    return new ConexionSocketIO(
      io('/chat', { withCredentials: true, transports: ['websocket'] }),
      oyentes,
    );
  }
}
