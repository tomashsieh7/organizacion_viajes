import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import SelectorTema from '../../../src/componentes/base/SelectorTema.vue';
import { CLAVE_TEMA, useTema } from '../../../src/composables/useTema';

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false, addEventListener: vi.fn() })),
  );
  useTema().iniciar();
});
afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

const montar = () => mount(SelectorTema, { attachTo: document.body });

describe('SelectorTema', () => {
  it('muestra las tres opciones, marca la actual y al elegir se cierra y aplica el modo', async () => {
    const w = montar();
    const boton = w.get('button[aria-expanded]');
    expect(boton.text()).toBe('Modo: Automático');
    expect(boton.attributes('aria-expanded')).toBe('false');
    await boton.trigger('click');
    expect(boton.attributes('aria-expanded')).toBe('true');
    const opciones = w.findAll('.tema__opcion');
    expect(opciones.map((o) => o.text())).toEqual(['Claro', 'Oscuro', 'Automático']);
    expect(opciones[2]!.attributes('aria-pressed')).toBe('true');
    await opciones[1]!.trigger('click');
    expect(w.find('.tema__opciones').exists()).toBe(false);
    expect(document.documentElement.dataset['tema']).toBe('oscuro');
    expect(localStorage.getItem(CLAVE_TEMA)).toBe('oscuro');
    expect(boton.text()).toBe('Modo: Oscuro');
    expect(document.activeElement).toBe(boton.element);
  });

  it('el botón muestra un sol en modo claro y una luna en oscuro, también en automático', async () => {
    const w = montar();
    const icono = () => w.get('button[aria-expanded] path').attributes('d');
    const SOL = 'M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0';
    expect(icono()).toBe(SOL);
    await w.get('button[aria-expanded]').trigger('click');
    await w.findAll('.tema__opcion')[1]!.trigger('click');
    expect(icono()).not.toBe(SOL);
    expect(icono()).toMatch(/^M20 14\.5/);
    // En automático con el sistema oscuro, también luna.
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true, addEventListener: vi.fn() })),
    );
    useTema().elegir('automatico');
    useTema().iniciar();
    await nextTick();
    expect(icono()).toMatch(/^M20 14\.5/);
  });

  it('Escape y un toque afuera lo cierran sin cambiar el modo', async () => {
    const w = montar();
    const boton = w.get('button[aria-expanded]');
    await boton.trigger('click');
    await w.get('.tema__opcion').trigger('keydown', { key: 'Escape' });
    expect(w.find('.tema__opciones').exists()).toBe(false);
    expect(document.activeElement).toBe(boton.element);
    await boton.trigger('click');
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await nextTick();
    expect(w.find('.tema__opciones').exists()).toBe(false);
    expect(document.documentElement.dataset['tema']).toBe('claro');
  });
});
