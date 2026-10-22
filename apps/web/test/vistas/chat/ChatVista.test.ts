import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { CLIENTE_CHAT } from '../../../src/clientes/chat';
import { useChatStore } from '../../../src/stores/chat';
import { useSesionStore } from '../../../src/stores/sesion';
import ChatVista from '../../../src/vistas/chat/ChatVista.vue';
import {
  ANA,
  abrirViaje,
  clienteAuthFalso,
  clienteChatFalso,
  clienteViajesFalso,
  errorDeApi,
  mensaje,
  montaje,
} from '../../soporte/clientesFalsos';

describe('ChatVista', () => {
  it('muestra el historial, distingue los propios y envía con Enter', async () => {
    const falso = clienteChatFalso({
      mensajes: [mensaje('m1', 'tomas', '¿Salimos a las 9?'), mensaje('m2', 'ana', 'Dale')],
      hayMas: true,
    });
    falso.conexion.enviar.mockImplementation(async (d) =>
      mensaje(d.id, 'ana', 'Perfecto', '2026-09-24T12:01:00.000Z'),
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

  it('si no carga el historial muestra el error con Reintentar en lugar de "no hay mensajes"', async () => {
    const falso = clienteChatFalso({ mensajes: [mensaje('m1', 'tomas', 'Hola')], hayMas: false });
    falso.cliente.historial.mockRejectedValueOnce(
      errorDeApi('SIN_CONEXION', 'No se pudo contactar al servidor', 0),
    );
    const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
      [CLIENTE_CHAT as symbol]: falso.cliente,
    });
    await abrirViaje(opciones);
    const vista = mount(ChatVista, opciones);
    useSesionStore().usuario = ANA;
    await useChatStore().entrar('v1');
    await flushPromises();
    expect(vista.get('[role="alert"]').text()).toContain('No se pudo contactar al servidor');
    expect(vista.text()).not.toContain('Todavía no hay mensajes');

    await vista.get('[role="alert"] button').trigger('click');
    await flushPromises();
    expect(vista.find('[role="alert"]').exists()).toBe(false);
    expect(vista.findAll('.mensaje').map((m) => m.text())).toEqual([
      expect.stringContaining('Hola'),
    ]);
  });

  it('RN-X9: el mensaje que no se pudo enviar se reintenta desde su burbuja', async () => {
    const falso = clienteChatFalso({ mensajes: [], hayMas: false });
    falso.conexion.enviar.mockRejectedValueOnce(
      errorDeApi('DEMASIADOS_MENSAJES', 'Esperá unos segundos antes de seguir escribiendo', 0),
    );
    const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
      [CLIENTE_CHAT as symbol]: falso.cliente,
    });
    await abrirViaje(opciones);
    const vista = mount(ChatVista, opciones);
    useSesionStore().usuario = ANA;
    await useChatStore().entrar('v1');
    await flushPromises();
    await vista.find('textarea').setValue('Llevo el mate');
    await vista.find('form').trigger('submit');
    await flushPromises();
    const burbuja = vista.find('.mensaje');
    expect(burbuja.text()).toContain('No se pudo enviar');
    falso.conexion.enviar.mockImplementation(async (d) => mensaje(d.id, 'ana', d.contenido));
    await burbuja.get('button').trigger('click');
    await flushPromises();
    expect(falso.conexion.enviar).toHaveBeenCalledTimes(2);
    expect(falso.conexion.enviar.mock.calls[1]![0]).toEqual(
      falso.conexion.enviar.mock.calls[0]![0],
    );
    expect(vista.find('.mensaje').attributes('data-estado')).toBe('enviado');
    expect(vista.find('.mensaje').text()).not.toContain('Reintentar');
  });

  it('RN-X8: no deja enviar caracteres de control ni un mensaje que no se ve, y dice por qué', async () => {
    const falso = clienteChatFalso({ mensajes: [], hayMas: false });
    const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
      [CLIENTE_CHAT as symbol]: falso.cliente,
    });
    await abrirViaje(opciones);
    const vista = mount(ChatVista, opciones);
    useSesionStore().usuario = ANA;
    await useChatStore().entrar('v1');
    await flushPromises();
    const campo = vista.find('textarea');
    const enviar = vista.find('button[type="submit"]');
    await campo.setValue('hola\u0000chau');
    expect(enviar.attributes('disabled')).toBeDefined();
    expect(vista.find('#mensaje-problema').text()).toBe('Tiene caracteres que no se pueden usar');
    expect(campo.attributes('aria-invalid')).toBe('true');
    await campo.setValue('\u200B\u200B');
    expect(vista.find('#mensaje-problema').text()).toBe('Escribí un mensaje');
    await campo.trigger('keydown', { key: 'Enter' });
    expect(falso.conexion.enviar).not.toHaveBeenCalled();
    // Vacío no muestra error; con saltos de línea y emojis vale.
    await campo.setValue('');
    expect(vista.find('#mensaje-problema').exists()).toBe(false);
    await campo.setValue('Hola\n😀');
    expect(enviar.attributes('disabled')).toBeUndefined();
  });
});
