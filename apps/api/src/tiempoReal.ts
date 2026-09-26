import type { Server as ServidorHttp } from 'node:http';
import { Server } from 'socket.io';
import type { Contenedor } from './contenedor.js';
import { NOMBRE_COOKIE_SESION } from './middlewares/acceso.js';
import { registrarGatewayChat, type EspacioChat } from './modulos/chat/infraestructura/socketIO.js';

/**
 * Conecta Socket.IO al servidor HTTP (D11): espacio de nombres `/chat` con su gateway, y el
 * notificador suscrito a los eventos de dominio del viaje.
 */
export function conectarTiempoReal(servidor: ServidorHttp, c: Contenedor): Server {
  const io = new Server(servidor, {
    // Solo WebSocket: su handshake siempre trae el encabezado Origin, que el navegador omite en
    // el primer pedido del transporte de sondeo por ser del mismo origen (D6).
    transports: ['websocket'],
    cors: { origin: c.config.ORIGEN_WEB, credentials: true },
  });
  const espacio: EspacioChat = io.of('/chat');
  registrarGatewayChat(espacio, {
    origenPermitido: c.config.ORIGEN_WEB,
    nombreCookie: NOMBRE_COOKIE_SESION,
    usuarioDeSesion: (token) => c.auth.obtenerUsuarioDeSesion.ejecutar(token),
    unirse: c.chat.unirse,
    enviar: c.chat.enviar,
  });
  c.chat.conectarNotificador(espacio);
  return io;
}
