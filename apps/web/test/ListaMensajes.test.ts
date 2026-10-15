import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ListaMensajes from '../src/componentes/chat/ListaMensajes.vue';
import type { MensajeEnPantalla } from '../src/stores/chat';
import { mensaje } from './soporte/clientesFalsos';

const a = (id: string, autor: string, enviadoEn: Date): MensajeEnPantalla => ({
  ...mensaje(id, autor, `texto ${id}`),
  enviadoEn: enviadoEn.toISOString(),
  estado: 'enviado',
});

afterEach(() => vi.useRealTimers());

describe('ListaMensajes', () => {
  it('separa por día y agrupa los mensajes seguidos de la misma persona', () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 15, 12, 0), toFake: ['Date'] });
    const vista = mount(ListaMensajes, {
      props: {
        miId: 'ana',
        hayMas: false,
        mensajes: [
          a('m1', 'tomas', new Date(2026, 8, 24, 21, 26)),
          a('m2', 'tomas', new Date(2026, 9, 14, 9, 0)),
          a('m3', 'tomas', new Date(2026, 9, 14, 9, 2)),
          // Más de 5 minutos después: vuelve a mostrarse el nombre.
          a('m4', 'tomas', new Date(2026, 9, 14, 9, 30)),
          a('m5', 'ana', new Date(2026, 9, 15, 11, 0)),
        ],
      },
    });
    expect(vista.findAll('.separador').map((s) => s.text())).toEqual(['24 sep', 'Ayer', 'Hoy']);
    const mensajes = vista.findAll('.mensaje');
    const nombreVisible = mensajes.map((m) =>
      m.find('.mensaje__autor').classes().includes('solo-lectores')
        ? ''
        : m.find('.mensaje__autor').text(),
    );
    expect(nombreVisible).toEqual(['Tomás', 'Tomás', '', 'Tomás', '']);
    // El propio dice "Vos" solo para lectores de pantalla.
    expect(mensajes[4]!.find('.mensaje__autor').text()).toBe('Vos');
    expect(mensajes[2]!.classes()).toContain('seguido');
    expect(mensajes[0]!.find('time').text()).toBe('21:26');
  });

  it('muestra las reacciones agrupadas y emite la elección, una por persona', async () => {
    const tomas = { id: 'tomas', nombre: 'Tomás', apodo: null };
    const ana = { id: 'ana', nombre: 'Ana', apodo: null };
    const m1 = {
      ...a('m1', 'tomas', new Date(2026, 9, 15, 10, 0)),
      reacciones: [
        { emoji: '👍', usuarios: [tomas, ana] },
        { emoji: '🎉', usuarios: [tomas] },
      ],
    };
    const pendiente: MensajeEnPantalla = { ...a('t1', 'ana', new Date()), estado: 'pendiente' };
    const vista = mount(ListaMensajes, {
      props: { miId: 'ana', hayMas: false, mensajes: [m1, pendiente] },
      attachTo: document.body,
    });
    const [pulgar, fiesta] = vista.findAll('.reaccion');
    expect(pulgar!.text()).toBe('👍2');
    expect(pulgar!.attributes('aria-pressed')).toBe('true');
    expect(pulgar!.attributes('aria-label')).toBe('👍 de Tomás y vos');
    expect(fiesta!.attributes('aria-pressed')).toBe('false');

    // Tocar la propia la quita; tocar otra la reemplaza.
    await pulgar!.trigger('click');
    await fiesta!.trigger('click');
    expect(vista.emitted('reaccionar')).toEqual([
      ['m1', null],
      ['m1', '🎉'],
    ]);

    // Un mensaje que todavía no se confirmó no se puede reaccionar.
    expect(vista.findAll('.reaccionar')).toHaveLength(1);
    const abrir = vista.find('.reaccionar');
    await abrir.trigger('click');
    await vi.waitFor(() => expect(document.activeElement?.textContent?.trim()).toBe('👍'));
    const opciones = vista.findAll('.selector button');
    expect(opciones.map((o) => o.text())).toEqual(['👍', '❤️', '😂', '😮', '😢', '🎉']);
    expect(opciones[0]!.attributes('aria-pressed')).toBe('true');
    await opciones[1]!.trigger('click');
    expect(vista.emitted('reaccionar')!.at(-1)).toEqual(['m1', '❤️']);
    await vi.waitFor(() => expect(document.activeElement).toBe(abrir.element));
    expect(vista.find('.selector').exists()).toBe(false);

    // Escape cierra sin elegir.
    await abrir.trigger('click');
    await vista.find('.selector').trigger('keydown', { key: 'Escape' });
    expect(vista.find('.selector').exists()).toBe(false);
    expect(vista.emitted('reaccionar')).toHaveLength(3);
    vista.unmount();
  });
});
