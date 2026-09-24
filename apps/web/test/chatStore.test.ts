import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { CLIENTE_CHAT } from '../src/clientes/chat';
import { ErrorDeApi } from '../src/clientes/http';
import { useChatStore } from '../src/stores/chat';
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
});
