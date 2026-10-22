import type { Namespace, Socket } from 'socket.io';
import {
  esquemaMensajeNuevo,
  type ConfirmacionSocket,
  type EventosClienteChat,
  type EventosServidorChat,
} from '@viajes/compartido';
import { ErrorDeDominio } from '../../../comun/errores.js';
import type { EnviarMensaje } from '../casos-de-uso/enviarMensaje.js';
import type { UnirseAlChat } from '../casos-de-uso/unirseAlChat.js';

interface DatosSocket {
  usuarioId: string;
  token: string;
}

export type EspacioChat = Namespace<EventosClienteChat, EventosServidorChat, object, DatosSocket>;

type SocketChat = Socket<EventosClienteChat, EventosServidorChat, object, DatosSocket>;

export const salaDelViaje = (viajeId: string) => `viaje:${viajeId}`;

export const salaDelUsuario = (usuarioId: string) => `usuario:${usuarioId}`;

/** Conexiones abiertas con una misma sesión, identificada por el hash de su token. */
const salaDeLaSesion = (tokenHash: string) => `sesion:${tokenHash}`;

/** RN-S5: al cerrarse una sesión se cortan sus conexiones, que dejan de recibir mensajes. */
export function cortarConexionesDeSesion(espacio: EspacioChat, tokenHash: string): void {
  espacio.in(salaDeLaSesion(tokenHash)).disconnectSockets(true);
}

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
  hashDeToken: (token: string) => string;
  unirse: UnirseAlChat;
  enviar: EnviarMensaje;
}

/**
 * Ritmo máximo de envío por persona, sumando todas sus conexiones: alcanza para charlar y frena a
 * quien inunda la sala.
 */
const MENSAJES_POR_VENTANA = 10;

const VENTANA_MS = 10_000;

/** Registra un envío y rechaza el que supera el ritmo máximo de los últimos `VENTANA_MS`. */
function controlarRitmo(envios: number[], ahora = Date.now()): void {
  while (envios.length > 0 && ahora - envios[0]! >= VENTANA_MS) envios.shift();
  if (envios.length >= MENSAJES_POR_VENTANA) {
    throw new ErrorDeDominio(
      'DEMASIADOS_INTENTOS',
      'DEMASIADOS_MENSAJES',
      'Esperá unos segundos antes de seguir escribiendo',
    );
  }
  envios.push(ahora);
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
  /** Momentos de los últimos envíos de cada usuario. */
  const enviosPorUsuario = new Map<string, number[]>();

  /**
   * Controla el ritmo del usuario. Antes descarta a quienes no enviaron nada en la última ventana,
   * así el registro solo guarda a los que están escribiendo.
   */
  function controlarRitmoDe(usuarioId: string, ahora = Date.now()): void {
    for (const [id, envios] of enviosPorUsuario) {
      if (ahora - envios.at(-1)! >= VENTANA_MS) enviosPorUsuario.delete(id);
    }
    const envios = enviosPorUsuario.get(usuarioId) ?? [];
    enviosPorUsuario.set(usuarioId, envios);
    controlarRitmo(envios, ahora);
  }

  espacio.use(async (socket, next) => {
    try {
      if (socket.handshake.headers.origin !== deps.origenPermitido) {
        throw new ErrorDeDominio('PROHIBIDO', 'ORIGEN_NO_PERMITIDO', 'Origen no permitido');
      }
      const token = leerCookie(socket.handshake.headers.cookie, deps.nombreCookie);
      socket.data.usuarioId = await deps.usuarioDeSesion(token);
      socket.data.token = token ?? '';
      await socket.join([
        salaDelUsuario(socket.data.usuarioId),
        salaDeLaSesion(deps.hashDeToken(socket.data.token)),
      ]);
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
          // La acción corre aunque el evento no pida confirmación, como `chat:salir`.
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
        controlarRitmoDe(usuarioId);
        const r = esquemaMensajeNuevo.safeParse(datos);
        if (!r.success) {
          throw new ErrorDeDominio(
            'VALIDACION',
            'VALIDACION',
            r.error.issues[0]?.message ?? 'Datos inválidos',
          );
        }
        const { id, viajeId, contenido } = r.data;
        const mensaje = await deps.enviar.ejecutar(viajeId, usuarioId, id, contenido);
        // Se emite a toda la sala, incluido quien lo envió; un reintento se reconoce por el id.
        espacio.to(salaDelViaje(viajeId)).emit('chat:mensaje', mensaje);
        return { mensaje };
      }),
    );
  });
}
