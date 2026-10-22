import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { CLIENTE_CHAT } from '../../src/clientes/chat';
import { ErrorDeApi } from '../../src/clientes/http';
import { useChatStore } from '../../src/stores/chat';
import { useSesionStore } from '../../src/stores/sesion';
import { useViajeStore } from '../../src/stores/viajes';
import {
  ANA,
  clienteAuthFalso,
  clienteChatFalso,
  clienteViajesFalso,
  detalle,
  mensaje,
  montaje,
} from '../soporte/clientesFalsos';

let falso: ReturnType<typeof clienteChatFalso>;
let chat: ReturnType<typeof useChatStore>;
let viaje: ReturnType<typeof useViajeStore>;
const obtener = vi.fn();

async function preparar(historial?: Parameters<typeof clienteChatFalso>[0]) {
  falso = clienteChatFalso(historial);
  const opciones = montaje(clienteAuthFalso(), clienteViajesFalso({ obtener }), {
    [CLIENTE_CHAT as symbol]: falso.cliente,
  });
  mount(
    defineComponent({
      setup: () => ((chat = useChatStore()), (viaje = useViajeStore()), () => h('div')),
    }),
    opciones,
  );
  useSesionStore().usuario = ANA;
  await chat.entrar('v1');
}

beforeEach(() => {
  obtener.mockReset();
  obtener.mockResolvedValue(detalle('ADMIN'));
});

describe('useChatStore', () => {
  it('al entrar a un viaje se conecta y se une a su sala', async () => {
    await preparar();
    expect(falso.cliente.conectar).toHaveBeenCalledTimes(1);
    expect(falso.conexion.unirse).toHaveBeenCalledWith('v1');
  });

  it('muestra el mensaje propio enseguida y lo reemplaza al confirmarse, sin duplicarlo', async () => {
    await preparar();
    let confirmar!: () => void;
    falso.conexion.enviar.mockImplementation(
      (datos) =>
        new Promise((listo) => {
          confirmar = () => listo(mensaje(datos.id, 'ana', 'Hola'));
        }),
    );
    const envio = chat.enviar('  Hola ');
    expect(chat.mensajes).toMatchObject([{ contenido: 'Hola', estado: 'pendiente' }]);
    const id = chat.mensajes[0]!.id;
    expect(falso.conexion.enviar).toHaveBeenCalledWith({ id, viajeId: 'v1', contenido: 'Hola' });
    // El eco de la sala puede llegar antes que la confirmación.
    falso.servidor().mensaje(mensaje(id, 'ana', 'Hola'));
    confirmar();
    await envio;
    expect(chat.mensajes).toHaveLength(1);
    expect(chat.mensajes[0]).toMatchObject({ id, estado: 'enviado' });
  });

  it('envía aunque el navegador no ofrezca crypto.randomUUID, como en http://192.168…', async () => {
    await preparar();
    vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) });
    try {
      falso.conexion.enviar.mockImplementation(async (datos) => mensaje(datos.id, 'ana', 'Hola'));
      await chat.enviar('Hola');
      expect(chat.mensajes).toMatchObject([{ estado: 'enviado' }]);
      expect(chat.mensajes[0]!.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('agrega los mensajes de los demás y marca los propios que fallan', async () => {
    await preparar();
    falso.servidor().mensaje(mensaje('m2', 'tomas', '¿A qué hora?'));
    falso.servidor().mensaje({ ...mensaje('m3', 'tomas', 'otro viaje'), viajeId: 'v2' });
    falso.conexion.enviar.mockRejectedValue(new ErrorDeApi(0, 'NO_PARTICIPANTE', 'No participás'));
    await chat.enviar('Hola');
    expect(chat.mensajes.map((m) => [m.contenido, m.estado])).toEqual([
      ['¿A qué hora?', 'enviado'],
      ['Hola', 'error'],
    ]);
    expect(chat.error).toBe('No participás');

    falso.conexion.enviar.mockImplementation(async (d) => mensaje(d.id, 'ana', 'Otra'));
    await chat.enviar('Otra');
    expect(chat.error).toBe('');
  });

  it('RN-X9: reintentar un mensaje que falló lo manda de nuevo con el mismo id', async () => {
    await preparar();
    falso.conexion.enviar.mockRejectedValueOnce(
      new ErrorDeApi(0, 'DEMASIADOS_MENSAJES', 'Esperá unos segundos'),
    );
    await chat.enviar('No me pierdas');
    const id = chat.mensajes[0]!.id;
    expect(chat.mensajes[0]).toMatchObject({ estado: 'error', contenido: 'No me pierdas' });
    falso.conexion.enviar.mockImplementation(async (d) => mensaje(d.id, 'ana', d.contenido));
    await chat.reintentar(id);
    expect(falso.conexion.enviar).toHaveBeenLastCalledWith({
      id,
      viajeId: 'v1',
      contenido: 'No me pierdas',
    });
    expect(chat.mensajes).toMatchObject([{ id, estado: 'enviado' }]);
    expect(chat.error).toBe('');
    // Uno que no falló no se reintenta.
    await chat.reintentar(id);
    expect(falso.conexion.enviar).toHaveBeenCalledTimes(2);
  });

  it('RN-X9: si el mensaje llegó aunque la respuesta se perdió, no queda como fallado', async () => {
    await preparar({ mensajes: [], hayMas: false });
    await chat.cargarHistorial();
    // La sala lo confirma y la respuesta al envío se pierde.
    falso.conexion.enviar.mockImplementationOnce(async (d) => {
      falso.servidor().mensaje(mensaje(d.id, 'ana', 'Llegó', '2026-09-24T12:00:01.000Z'));
      throw new ErrorDeApi(0, 'SIN_CONEXION', 'No se pudo conectar con el chat');
    });
    await chat.enviar('Llegó');
    expect(chat.mensajes).toMatchObject([{ estado: 'enviado' }]);
    expect(chat.error).toBe('');

    // Sin conexión falla; al reconectarse el historial trae que sí llegó, en su lugar.
    falso.conexion.enviar.mockRejectedValueOnce(
      new ErrorDeApi(0, 'SIN_CONEXION', 'No se pudo conectar con el chat'),
    );
    await chat.enviar('Sin señal');
    const sinSenal = chat.mensajes[1]!.id;
    falso.conexion.enviar.mockRejectedValueOnce(
      new ErrorDeApi(0, 'SIN_CONEXION', 'No se pudo conectar con el chat'),
    );
    await chat.enviar('Este no llegó');
    expect(chat.error).toBe('No se pudo conectar con el chat');
    falso.cliente.historial.mockResolvedValueOnce({
      mensajes: [
        mensaje(chat.mensajes[0]!.id, 'ana', 'Llegó', '2026-09-24T12:00:01.000Z'),
        mensaje('t1', 'tomas', 'Mientras no tenías señal', '2026-09-24T12:00:02.000Z'),
        mensaje(sinSenal, 'ana', 'Sin señal', '2026-09-24T12:00:03.000Z'),
      ],
      hayMas: false,
    });
    falso.servidor().reconectado();
    expect(chat.error).toBe('');
    await vi.waitFor(() =>
      expect(chat.mensajes.map((m) => [m.contenido, m.estado])).toEqual([
        ['Llegó', 'enviado'],
        ['Mientras no tenías señal', 'enviado'],
        ['Sin señal', 'enviado'],
        ['Este no llegó', 'error'],
      ]),
    );
    // Uno de otro que llega después queda antes del propio que espera o falló.
    falso.servidor().mensaje(mensaje('t2', 'tomas', 'Nuevo', '2026-09-24T12:00:04.000Z'));
    expect(chat.mensajes.map((m) => m.contenido).slice(-2)).toEqual(['Nuevo', 'Este no llegó']);
  });

  it('si el que figuraba como fallado llega después por la sala, se va el aviso', async () => {
    await preparar();
    falso.conexion.enviar.mockRejectedValue(
      new ErrorDeApi(0, 'SIN_CONEXION', 'No se pudo conectar con el chat'),
    );
    await chat.enviar('Uno');
    await chat.enviar('Dos');
    const [uno, dos] = chat.mensajes.map((m) => m.id);
    falso.servidor().mensaje(mensaje(uno!, 'ana', 'Uno'));
    // Queda otro fallado: el aviso sigue.
    expect(chat.error).toBe('No se pudo conectar con el chat');
    falso.servidor().mensaje(mensaje(dos!, 'ana', 'Dos'));
    expect(chat.error).toBe('');
    expect(chat.mensajes.map((m) => m.estado)).toEqual(['enviado', 'enviado']);
  });

  it('carga el historial y las páginas anteriores sin repetir mensajes', async () => {
    await preparar({
      mensajes: [mensaje('m3', 'ana', 'tres'), mensaje('m4', 'ana', 'cuatro')],
      hayMas: true,
    });
    await chat.cargarHistorial();
    falso.cliente.historial.mockResolvedValueOnce({
      mensajes: [
        mensaje('m1', 'ana', 'uno'),
        mensaje('m2', 'ana', 'dos'),
        mensaje('m3', 'ana', 'tres'),
      ],
      hayMas: false,
    });
    await chat.cargarAnteriores();
    expect(falso.cliente.historial).toHaveBeenLastCalledWith('v1', 'm3');
    expect(chat.mensajes.map((m) => m.id)).toEqual(['m1', 'm2', 'm3', 'm4']);
    expect(chat.hayMas).toBe(false);
  });

  it('al reconectarse recupera los mensajes que se perdió', async () => {
    await preparar({ mensajes: [mensaje('m1', 'ana', 'uno')], hayMas: false });
    await chat.cargarHistorial();
    falso.cliente.historial.mockResolvedValueOnce({
      mensajes: [mensaje('m1', 'ana', 'uno'), mensaje('m2', 'tomas', 'mientras no estabas')],
      hayMas: false,
    });
    falso.servidor().reconectado();
    await vi.waitFor(() => expect(chat.mensajes).toHaveLength(2));
  });

  it('RN-E4 y CU24: registra la baja y refresca el viaje con el cambio de Admin', async () => {
    await preparar();
    await viaje.abrir('v1');
    obtener.mockClear();
    falso
      .servidor()
      .adminCambiado({ viajeId: 'v1', nuevoAdminId: 'tomas', anteriorAdminId: 'ana' });
    await vi.waitFor(() => expect(obtener).toHaveBeenCalledWith('v1'));
    falso
      .servidor()
      .membresiaFinalizada({ viajeId: 'v2', motivo: 'ELIMINADO', conservaAccesoSaldos: false });
    expect(chat.finalizada).toBeNull();
    const aviso = { viajeId: 'v1', motivo: 'ELIMINADO' as const, conservaAccesoSaldos: false };
    falso.servidor().membresiaFinalizada(aviso);
    expect(chat.finalizada).toEqual(aviso);
  });
});
