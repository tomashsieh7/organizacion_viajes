import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { CLIENTE_CHAT } from '../src/clientes/chat';
import { ErrorDeApi } from '../src/clientes/http';
import { DURACION_ESCRIBIENDO_MS, INTERVALO_AVISO_MS, useChatStore } from '../src/stores/chat';
import { useSesionStore } from '../src/stores/sesion';
import { useViajeStore } from '../src/stores/viaje';
import {
  ANA,
  clienteAuthFalso,
  clienteChatFalso,
  clienteViajesFalso,
  detalle,
  mensaje,
  montaje,
} from './soporte/clientesFalsos';

let falso: ReturnType<typeof clienteChatFalso>;
let chat: ReturnType<typeof useChatStore>;
let viaje: ReturnType<typeof useViajeStore>;
const obtener = vi.fn();

async function preparar(
  historial?: Parameters<typeof clienteChatFalso>[0],
  configurar?: (f: typeof falso) => void,
) {
  falso = clienteChatFalso(historial);
  configurar?.(falso);
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
  return chat.entrar('v1');
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
    let confirmar!: (m: ReturnType<typeof mensaje>) => void;
    falso.conexion.enviar.mockImplementation(
      (datos) =>
        new Promise((listo) => {
          confirmar = () => listo(mensaje('m1', 'ana', 'Hola', datos.idTemporal));
        }),
    );
    const envio = chat.enviar('  Hola ');
    expect(chat.mensajes).toMatchObject([{ contenido: 'Hola', estado: 'pendiente' }]);
    const temporal = chat.mensajes[0]!.idTemporal!;
    // El eco de la sala puede llegar antes que la confirmación.
    falso.servidor().mensaje(mensaje('m1', 'ana', 'Hola', temporal));
    confirmar(mensaje('m1', 'ana', 'Hola', temporal));
    await envio;
    expect(chat.mensajes).toHaveLength(1);
    expect(chat.mensajes[0]).toMatchObject({ id: 'm1', estado: 'enviado', idTemporal: temporal });
  });

  it('envía aunque el navegador no ofrezca crypto.randomUUID, como en http://192.168…', async () => {
    await preparar();
    vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) });
    try {
      falso.conexion.enviar.mockImplementation(async (datos) =>
        mensaje('m1', 'ana', 'Hola', datos.idTemporal),
      );
      await chat.enviar('Hola');
      expect(chat.mensajes).toMatchObject([{ id: 'm1', estado: 'enviado' }]);
      expect(chat.mensajes[0]!.idTemporal).toMatch(/^[0-9a-f]{32}$/);
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

  it('aplica las reacciones que confirma el servidor y las que llegan de otros', async () => {
    await preparar({ mensajes: [mensaje('m1', 'tomas', 'Llegamos')], hayMas: false });
    await chat.cargarHistorial();
    const deAna = [{ emoji: '🎉', usuarios: [ANA] }];
    falso.conexion.reaccionar.mockResolvedValue(deAna);
    await chat.reaccionar('m1', '🎉');
    expect(falso.conexion.reaccionar).toHaveBeenCalledWith({
      viajeId: 'v1',
      mensajeId: 'm1',
      emoji: '🎉',
    });
    expect(chat.mensajes[0]!.reacciones).toEqual(deAna);

    falso.servidor().reacciones({ viajeId: 'v1', mensajeId: 'm1', reacciones: [] });
    expect(chat.mensajes[0]!.reacciones).toEqual([]);
    // De otro viaje no se aplica.
    falso.servidor().reacciones({ viajeId: 'v2', mensajeId: 'm1', reacciones: deAna });
    expect(chat.mensajes[0]!.reacciones).toEqual([]);

    falso.conexion.reaccionar.mockRejectedValue(new ErrorDeApi(0, 'SIN_CONEXION', 'Sin conexión'));
    await chat.reaccionar('m1', '👍');
    expect(chat.error).toBe('Sin conexión');
  });

  it('"escribiendo" se borra a los 5 segundos o cuando llega el mensaje de esa persona', async () => {
    await preparar();
    vi.useFakeTimers();
    try {
      const tomas = { id: 'tomas', nombre: 'Tomás', apodo: null };
      const luis = { id: 'luis', nombre: 'Luis', apodo: null };
      falso.servidor().escribiendo({ viajeId: 'v1', usuario: tomas });
      falso.servidor().escribiendo({ viajeId: 'v1', usuario: luis });
      falso.servidor().escribiendo({ viajeId: 'v1', usuario: tomas });
      falso.servidor().escribiendo({ viajeId: 'v2', usuario: { ...luis, id: 'eva' } });
      expect(chat.quienesEscriben).toEqual([luis, tomas]);

      falso.servidor().mensaje(mensaje('m1', 'tomas', 'Ya está'));
      expect(chat.quienesEscriben).toEqual([luis]);
      vi.advanceTimersByTime(DURACION_ESCRIBIENDO_MS);
      expect(chat.quienesEscriben).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('avisa que uno escribe como mucho cada 3 segundos', async () => {
    await preparar();
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      chat.avisarEscribiendo();
      chat.avisarEscribiendo();
      await flushPromises();
      expect(falso.conexion.escribiendo).toHaveBeenCalledTimes(1);
      expect(falso.conexion.escribiendo).toHaveBeenCalledWith('v1');
      vi.advanceTimersByTime(INTERVALO_AVISO_MS);
      chat.avisarEscribiendo();
      await flushPromises();
      expect(falso.conexion.escribiendo).toHaveBeenCalledTimes(2);
      // Después de enviar un mensaje, el próximo aviso no espera.
      falso.conexion.enviar.mockResolvedValue(mensaje('m1', 'ana', 'Hola'));
      await chat.enviar('Hola');
      chat.avisarEscribiendo();
      await flushPromises();
      expect(falso.conexion.escribiendo).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it('el aviso de escribiendo espera a que termine la entrada a la sala', async () => {
    let unido!: () => void;
    const entrada = preparar(undefined, (f) =>
      f.conexion.unirse.mockImplementation(
        () => new Promise<undefined>((r) => (unido = () => r(undefined))),
      ),
    );
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      chat.avisarEscribiendo();
      await flushPromises();
      expect(falso.conexion.escribiendo).not.toHaveBeenCalled();
      unido();
      await entrada;
      await flushPromises();
      expect(falso.conexion.escribiendo).toHaveBeenCalledWith('v1');
    } finally {
      vi.useRealTimers();
    }
  });

  it('marca el chat como leído y no falla si el pedido falla', async () => {
    await preparar();
    await chat.marcarLeido();
    expect(falso.cliente.marcarLeido).toHaveBeenCalledWith('v1');
    falso.cliente.marcarLeido.mockRejectedValueOnce(new ErrorDeApi(0, 'SIN_CONEXION', 'x'));
    await expect(chat.marcarLeido()).resolves.toBeUndefined();
    expect(chat.error).toBe('');
  });
});
