import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClienteChatSocketIO } from '../../src/clientes/chat';
import { alPerderSesion } from '../../src/clientes/http';

// Un socket falso cuyo servidor rechaza todo con la respuesta indicada.
const respuesta = {
  ok: false,
  error: { codigo: 'NO_AUTENTICADO', mensaje: 'Tenés que iniciar sesión' },
};
// Los oyentes que registra el cliente, para simular eventos del socket.
const oyentesDelSocket = new Map<string, (...args: unknown[]) => void>();
vi.mock('socket.io-client', () => ({
  io: () => ({
    on: (evento: string, oyente: (...args: unknown[]) => void) =>
      oyentesDelSocket.set(evento, oyente),
    io: { on: vi.fn() },
    timeout: () => ({ emitWithAck: async () => respuesta }),
  }),
}));

const oyentes = {
  mensaje: vi.fn(),
  membresiaFinalizada: vi.fn(),
  adminCambiado: vi.fn(),
  reconectado: vi.fn(),
};

afterEach(() => alPerderSesion(() => {}));

describe('ClienteChatSocketIO y la sesión', () => {
  it('avisa que se perdió la sesión cuando el chat la rechaza con NO_AUTENTICADO', async () => {
    const accion = vi.fn();
    alPerderSesion(accion);
    const conexion = new ClienteChatSocketIO().conectar(oyentes);
    await expect(conexion.unirse('v1')).rejects.toMatchObject({ codigo: 'NO_AUTENTICADO' });
    expect(accion).toHaveBeenCalledTimes(1);
  });

  it('no avisa con otros rechazos', async () => {
    const accion = vi.fn();
    alPerderSesion(accion);
    respuesta.error.codigo = 'NO_PARTICIPANTE';
    const conexion = new ClienteChatSocketIO().conectar(oyentes);
    await expect(conexion.unirse('v1')).rejects.toMatchObject({ codigo: 'NO_PARTICIPANTE' });
    expect(accion).not.toHaveBeenCalled();
  });

  it('RN-S5: avisa que se perdió la sesión cuando el servidor corta la conexión', () => {
    const accion = vi.fn();
    alPerderSesion(accion);
    new ClienteChatSocketIO().conectar(oyentes);
    oyentesDelSocket.get('disconnect')!('transport close');
    expect(accion).not.toHaveBeenCalled();
    oyentesDelSocket.get('disconnect')!('io server disconnect');
    expect(accion).toHaveBeenCalledTimes(1);
  });
});
