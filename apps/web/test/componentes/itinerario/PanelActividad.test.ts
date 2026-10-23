import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PanelActividad from '../../../src/componentes/itinerario/PanelActividad.vue';

const kayak = {
  id: 'k',
  titulo: 'Kayak',
  descripcion: 'Con guía',
  fecha: '2026-12-11',
  horaInicio: '10:00',
  horaFin: '12:00',
  duracionMin: 120,
  ubicacion: 'Bahía López',
  latitud: -41,
  longitud: -71,
};

describe('PanelActividad', () => {
  it('muestra horario, ubicación y descripción', () => {
    const w = mount(PanelActividad, { props: { actividad: kayak, numero: 1, confirmada: true } });
    expect(w.text()).toContain('11 dic 2026 · 10:00 a 12:00 (2 h)');
    expect(w.text()).toContain('Bahía López');
    expect(w.find('.descripcion').text()).toBe('Con guía');
  });

  it('RN-X8: sin descripción no deja un renglón vacío', () => {
    const w = mount(PanelActividad, {
      props: { actividad: { ...kayak, descripcion: '' }, numero: 1, confirmada: true },
    });
    expect(w.find('.descripcion').exists()).toBe(false);
    expect(w.findAll('p').map((p) => p.text())).not.toContain('');
  });
});
