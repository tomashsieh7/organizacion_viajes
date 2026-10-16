import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import AvisoCelebracion from '../../../src/componentes/base/AvisoCelebracion.vue';
import AnilloProgreso from '../../../src/componentes/viajes/AnilloProgreso.vue';
import IconoLinea from '../../../src/componentes/base/IconoLinea.vue';
import { DURACION_CELEBRACION_MS, useCelebracion } from '../../../src/composables/useCelebracion';

afterEach(() => {
  useCelebracion().cerrar();
  vi.useRealTimers();
});

describe('AvisoCelebracion', () => {
  it('anuncia el mensaje, muestra la lluvia de emojis y se va solo', async () => {
    vi.useFakeTimers();
    const aviso = mount(AvisoCelebracion);
    expect(aviso.find('[role="status"]').text()).toBe('');
    useCelebracion().celebrar('¡Confirmaron Kayak!');
    await nextTick();
    expect(aviso.find('[role="status"]').text()).toContain('¡Confirmaron Kayak!');
    expect(aviso.findAll('.particula')).toHaveLength(6);
    vi.advanceTimersByTime(DURACION_CELEBRACION_MS);
    await nextTick();
    expect(aviso.find('.mensaje').exists()).toBe(false);
  });

  it('se puede cerrar antes y la última celebración reemplaza a la anterior', async () => {
    const aviso = mount(AvisoCelebracion);
    const { celebrar } = useCelebracion();
    celebrar('Primera');
    celebrar('Segunda');
    await nextTick();
    expect(aviso.findAll('.mensaje')).toHaveLength(1);
    expect(aviso.text()).toContain('Segunda');
    await aviso.find('button[aria-label="Cerrar"]').trigger('click');
    expect(aviso.find('.mensaje').exists()).toBe(false);
  });
});

describe('AnilloProgreso e IconoLinea', () => {
  it('el anillo informa su valor a los lectores de pantalla', () => {
    const anillo = mount(AnilloProgreso, { props: { porcentaje: 60 } });
    expect(anillo.attributes()).toMatchObject({ role: 'progressbar', 'aria-valuenow': '60' });
    expect(anillo.text()).toContain('60%');
  });

  it('los íconos son decorativos y usan el color del texto', () => {
    const icono = mount(IconoLinea, { props: { nombre: 'pin' } });
    expect(icono.attributes()).toMatchObject({ 'aria-hidden': 'true', stroke: 'currentColor' });
    expect(icono.findAll('path')).toHaveLength(2);
  });
});
