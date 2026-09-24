import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server } from 'socket.io';
import { io as conectarCliente, type Socket } from 'socket.io-client';
import {
  NotificadorViajeSocketIO,
  salaDelUsuario,
  salaDelViaje,
  type EspacioChat,
} from '../../src/modulos/chat/infraestructura/socketIO.js';
import { NotificadorViajeEnMemoria, type EventoRecibido } from '../soporte/memoria.js';
import { probarContratoNotificadorViaje } from './notificadorViaje.contrato.js';

probarContratoNotificadorViaje('en memoria', async () => {
  const notificador = new NotificadorViajeEnMemoria();
  return {
    notificador,
    conectar: async (usuarioId, viajeId) => notificador.conectar(usuarioId, viajeId),
    esperar: async () => undefined,
    cerrar: async () => undefined,
  };
});

probarContratoNotificadorViaje('Socket.IO', async () => {
  const http = createServer();
  const io = new Server(http);
  const espacio: EspacioChat = io.of('/chat');
  // Sin el gateway: cada conexión declara su usuario y su viaje, y entra a las salas que usa el notificador.
  espacio.use(async (socket, next) => {
    const { usuarioId, viajeId } = socket.handshake.auth as { usuarioId: string; viajeId: string };
    socket.data.usuarioId = usuarioId;
    await socket.join([salaDelUsuario(usuarioId), salaDelViaje(viajeId)]);
    next();
  });
  await new Promise<void>((listo) => http.listen(0, listo));
  const url = `http://localhost:${(http.address() as AddressInfo).port}/chat`;
  const clientes: Socket[] = [];
  return {
    notificador: new NotificadorViajeSocketIO(espacio),
    async conectar(usuarioId, viajeId) {
      const recibidos: EventoRecibido[] = [];
      const cliente = conectarCliente(url, {
        auth: { usuarioId, viajeId },
        transports: ['websocket'],
      });
      cliente.on('viaje:membresia-finalizada', (datos) =>
        recibidos.push({ nombre: 'viaje:membresia-finalizada', datos }),
      );
      cliente.on('viaje:admin-cambiado', (datos) =>
        recibidos.push({ nombre: 'viaje:admin-cambiado', datos }),
      );
      clientes.push(cliente);
      await new Promise<void>((listo) => cliente.once('connect', () => listo()));
      return recibidos;
    },
    esperar: () => new Promise((listo) => setTimeout(listo, 150)),
    async cerrar() {
      for (const c of clientes) c.disconnect();
      await new Promise<void>((listo) => io.close(() => listo()));
    },
  };
});
