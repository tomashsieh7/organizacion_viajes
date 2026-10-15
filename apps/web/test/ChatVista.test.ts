import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { CLIENTE_CHAT } from '../src/clientes/chat';
import { useChatStore } from '../src/stores/chat';
import { useSesionStore } from '../src/stores/sesion';
import ChatVista from '../src/vistas/ChatVista.vue';
import {
  ANA,
  abrirViaje,
  clienteAuthFalso,
  clienteChatFalso,
  clienteViajesFalso,
  mensaje,
  montaje,
} from './soporte/clientesFalsos';

describe('ChatVista', () => {
  it('muestra el historial, distingue los propios y envía con Enter', async () => {
    const falso = clienteChatFalso({
      mensajes: [mensaje('m1', 'tomas', '¿Salimos a las 9?'), mensaje('m2', 'ana', 'Dale')],
      hayMas: true,
    });
    falso.conexion.enviar.mockImplementation(async (d) =>
      mensaje('m3', 'ana', 'Perfecto', d.idTemporal),
    );
    const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
      [CLIENTE_CHAT as symbol]: falso.cliente,
    });
    await abrirViaje(opciones);
    const vista = mount(ChatVista, opciones);
    useSesionStore().usuario = ANA;
    await useChatStore().entrar('v1');
    await flushPromises();

    const mensajes = vista.findAll('.mensaje');
    expect(mensajes.map((m) => m.find('strong').text())).toEqual(['Tomás', 'Vos']);
    expect(mensajes[1]!.classes()).toContain('propio');
    expect(vista.text()).toContain('Ver mensajes anteriores');

    const campo = vista.find('textarea');
    await campo.setValue('   ');
    expect(vista.find('button[type="submit"]').attributes('disabled')).toBeDefined();
    await campo.setValue('Perfecto');
    await campo.trigger('keydown', { key: 'Enter' });
    await flushPromises();
    expect(falso.conexion.enviar).toHaveBeenCalledWith(
      expect.objectContaining({ viajeId: 'v1', contenido: 'Perfecto' }),
    );
    expect(vista.findAll('.mensaje').at(-1)!.text()).toContain('Perfecto');
    expect((campo.element as HTMLTextAreaElement).value).toBe('');
    vi.restoreAllMocks();
  });

  it('marca leído al entrar y al salir, avisa que uno escribe y muestra quién escribe', async () => {
    const falso = clienteChatFalso();
    const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
      [CLIENTE_CHAT as symbol]: falso.cliente,
    });
    await abrirViaje(opciones);
    useSesionStore().usuario = ANA;
    await useChatStore().entrar('v1');
    const vista = mount(ChatVista, opciones);
    await flushPromises();
    expect(falso.cliente.marcarLeido).toHaveBeenCalledTimes(1);

    await vista.find('textarea').setValue('Ho');
    expect(falso.conexion.escribiendo).toHaveBeenCalledWith('v1');
    falso.servidor().escribiendo({
      viajeId: 'v1',
      usuario: { id: 'tomas', nombre: 'Tomás', apodo: null },
    });
    await flushPromises();
    expect(vista.find('.escribiendo').text()).toBe('Tomás está escribiendo…');

    vista.unmount();
    expect(falso.cliente.marcarLeido).toHaveBeenCalledTimes(2);
  });

  it('con el chat abierto, lo que llega de otros se marca leído a los 2 segundos', async () => {
    const falso = clienteChatFalso();
    const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
      [CLIENTE_CHAT as symbol]: falso.cliente,
    });
    await abrirViaje(opciones);
    useSesionStore().usuario = ANA;
    await useChatStore().entrar('v1');
    const vista = mount(ChatVista, opciones);
    await flushPromises();
    vi.useFakeTimers();
    try {
      falso.servidor().mensaje(mensaje('m1', 'tomas', 'Hola'));
      falso.servidor().mensaje(mensaje('m2', 'tomas', '¿Vamos?'));
      await flushPromises();
      vi.advanceTimersByTime(2_000);
      expect(falso.cliente.marcarLeido).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
      vista.unmount();
    }
  });
});
