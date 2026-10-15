import type { Namespace, Socket } from 'socket.io';
import type { z } from 'zod';
import {
  esquemaEscribiendo,
  esquemaMensajeNuevo,
  esquemaReaccion,
  type AvisoAdminCambiado,
  type AvisoMembresiaFinalizada,
  type ConfirmacionSocket,
  type EventosClienteChat,
  type EventosServidorChat,
  type PersonaVista,
} from '@viajes/compartido';
import { ErrorDeDominio } from '../../../compartido/errores.js';
import type {
  EnviarMensaje,
  ReaccionarAMensaje,
  UnirseAlChat,
} from '../casos-de-uso/casosDeUsoChat.js';
import type { NotificadorViaje } from '../dominio/puertos.js';

interface DatosSocket {
  usuarioId: string;
  token: string;
  /** Para avisar quién escribe sin consultar la base en cada tecla. */
  persona: PersonaVista;
}

export type EspacioChat = Namespace<EventosClienteChat, EventosServidorChat, object, DatosSocket>;
type SocketChat = Socket<EventosClienteChat, EventosServidorChat, object, DatosSocket>;

export const salaDelViaje = (viajeId: string) => `viaje:${viajeId}`;
export const salaDelUsuario = (usuarioId: string) => `usuario:${usuarioId}`;

/** Lee una cookie del encabezado `Cookie` del handshake. */
function leerCookie(encabezado: string | undefined, nombre: string): string | undefined {
  for (const parte of (encabezado ?? '').split(';')) {
    const [clave, ...valor] = parte.trim().split('=');
    if (clave === nombre) {
      try {
        return decodeURIComponent(valor.join('='));
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

export interface DependenciasGatewayChat {
  origenPermitido: string;
  nombreCookie: string;
  usuarioDeSesion: (token: string | undefined) => Promise<string>;
  personaDeUsuario: (usuarioId: string) => Promise<PersonaVista>;
  unirse: UnirseAlChat;
  enviar: EnviarMensaje;
  reaccionar: ReaccionarAMensaje;
}

/** Los datos de un evento llegan sin pasar por las rutas: se validan con el mismo esquema. */
function validarDatos<S extends z.ZodType>(esquema: S, datos: unknown): z.output<S> {
  const r = esquema.safeParse(datos);
  if (!r.success) {
    throw new ErrorDeDominio(
      'VALIDACION',
      'VALIDACION',
      r.error.issues[0]?.message ?? 'Datos inválidos',
    );
  }
  return r.data;
}

function rechazo(error: unknown): ConfirmacionSocket {
  if (error instanceof ErrorDeDominio) {
    return { ok: false, error: { codigo: error.codigo, mensaje: error.message } };
  }
  console.error(error);
  return { ok: false, error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error inesperado' } };
}

/**
 * Gateway de Socket.IO del chat (sección 5.8 de PLAN.md). El handshake exige el `Origin` de la
 * aplicación y una sesión vigente (D6); cada evento vuelve a validar la sesión, así una sesión
 * cerrada o vencida deja de poder usar una conexión abierta.
 */
export function registrarGatewayChat(espacio: EspacioChat, deps: DependenciasGatewayChat): void {
  espacio.use(async (socket, next) => {
    try {
      if (socket.handshake.headers.origin !== deps.origenPermitido) {
        throw new ErrorDeDominio('PROHIBIDO', 'ORIGEN_NO_PERMITIDO', 'Origen no permitido');
      }
      const token = leerCookie(socket.handshake.headers.cookie, deps.nombreCookie);
      socket.data.usuarioId = await deps.usuarioDeSesion(token);
      socket.data.token = token ?? '';
      socket.data.persona = await deps.personaDeUsuario(socket.data.usuarioId);
      await socket.join(salaDelUsuario(socket.data.usuarioId));
      next();
    } catch (error) {
      const codigo = error instanceof ErrorDeDominio ? error.codigo : 'ERROR_INTERNO';
      next(Object.assign(new Error(codigo), { data: { codigo } }));
    }
  });

  espacio.on('connection', (socket: SocketChat) => {
    /** Ejecuta un evento con la sesión revalidada y responde con la confirmación. */
    const manejar =
      <D, R extends object>(accion: (usuarioId: string, datos: D) => Promise<R>) =>
      async (datos: D, confirmar?: (r: ConfirmacionSocket<R>) => void) => {
        try {
          const usuarioId = await deps.usuarioDeSesion(socket.data.token);
          if (usuarioId !== socket.data.usuarioId) throw new Error('La sesión cambió de usuario');
          // La acción corre aunque el evento no pida confirmación, como `chat:escribiendo`.
          const resultado = await accion(usuarioId, datos);
          confirmar?.({ ok: true, ...resultado });
        } catch (error) {
          confirmar?.(rechazo(error) as ConfirmacionSocket<R>);
          // Con la sesión cerrada o vencida se corta la conexión, después de responder.
          if (error instanceof ErrorDeDominio && error.codigo === 'NO_AUTENTICADO') {
            setImmediate(() => socket.disconnect(true));
          }
        }
      };

    socket.on(
      'chat:unirse',
      manejar(async (usuarioId, datos: { viajeId: string }) => {
        const viajeId = String(datos?.viajeId ?? '');
        await deps.unirse.ejecutar(viajeId, usuarioId);
        await socket.join(salaDelViaje(viajeId));
        return {};
      }),
    );

    socket.on(
      'chat:salir',
      manejar(async (_usuarioId, datos: { viajeId: string }) => {
        await socket.leave(salaDelViaje(String(datos?.viajeId ?? '')));
        return {};
      }),
    );

    socket.on(
      'chat:enviar',
      manejar(async (usuarioId, datos: unknown) => {
        const d = validarDatos(esquemaMensajeNuevo, datos);
        const mensaje = await deps.enviar.ejecutar(d.viajeId, usuarioId, d.contenido);
        // Se emite a toda la sala, incluido quien lo envió, con su identificador temporal.
        espacio
          .to(salaDelViaje(d.viajeId))
          .emit('chat:mensaje', { ...mensaje, idTemporal: d.idTemporal });
        return { mensaje: { ...mensaje, idTemporal: d.idTemporal } };
      }),
    );

    socket.on(
      'chat:reaccionar',
      manejar(async (usuarioId, datos: unknown) => {
        const d = validarDatos(esquemaReaccion, datos);
        const reacciones = await deps.reaccionar.ejecutar(
          d.viajeId,
          usuarioId,
          d.mensajeId,
          d.emoji,
        );
        espacio
          .to(salaDelViaje(d.viajeId))
          .emit('chat:reacciones', { viajeId: d.viajeId, mensajeId: d.mensajeId, reacciones });
        return { reacciones };
      }),
    );

    // Sin persistencia: se reenvía al resto de la sala. Solo se llega a la sala con
    // `chat:unirse`, que exige participar (RN-X1), y una baja la vacía (RN-E4).
    socket.on(
      'chat:escribiendo',
      manejar(async (_usuarioId, datos: unknown) => {
        const { viajeId } = validarDatos(esquemaEscribiendo, datos);
        const sala = salaDelViaje(viajeId);
        if (socket.rooms.has(sala)) {
          socket.to(sala).emit('chat:escribiendo', { viajeId, usuario: socket.data.persona });
        }
        return {};
      }),
    );
  });
}

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
