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
});
