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
});
