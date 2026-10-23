import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RenglonActividad from '../../../src/componentes/actividades/RenglonActividad.vue';
import { actividad } from '../../soporte/clientesFalsos';

const moneda = { codigo: 'ARS', nombre: 'Peso argentino', decimales: 2 };
const trekking = {
  ...actividad('t', 'Trekking', { alternativaDe: { id: 'k', titulo: 'Kayak' } }),
  votosAFavor: 2,
  votosEnContra: 1,
};

function montar(alternativa: boolean, soyAdmin = false) {
  return mount(RenglonActividad, {
    props: { actividad: trekking, alternativa, soyAdmin, moneda, viajeId: 'v1' },
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  });
}

describe('RenglonActividad', () => {
  it('muestra hora, título, votos y estado, y la alternativa con una «o»', () => {
    const w = montar(true);
    expect(w.get('.renglon__hora').text()).toBe('10:00');
    expect(w.get('.renglon__titulo').text()).toBe('o Trekking');
    expect(w.get('.renglon__votos [aria-hidden="true"]').text()).toBe('Sí 2 · No 1');
    expect(w.get('.renglon__votos .solo-lectores').text()).toBe('2 a favor y 1 en contra');
    expect(w.get('.insignia').text()).toBe('Pendiente');
    expect(w.classes()).toContain('renglon--alternativa');
  });

  it('debajo de su original no repite de cuál es alternativa; sola, sí', async () => {
    const debajo = montar(true);
    await debajo.get('.renglon__fila').trigger('click');
    expect(debajo.text()).not.toContain('Alternativa de «Kayak»');
    const sola = montar(false);
    expect(sola.get('.renglon__titulo').text()).toBe('Trekking');
    await sola.get('.renglon__fila').trigger('click');
    expect(sola.text()).toContain('Alternativa de «Kayak»');
  });

  it('los votos y resoluciones de la tarjeta abierta salen con el id de la propuesta', async () => {
    const w = montar(false, true);
    await w.get('.renglon__fila').trigger('click');
    await w.find('[aria-label="A favor"]').trigger('click');
    await w
      .findAll('button')
      .find((b) => b.text() === 'Confirmar')!
      .trigger('click');
    expect(w.emitted('votar')).toEqual([['t', 'A_FAVOR']]);
    expect(w.emitted('resolver')).toEqual([['t', 'confirmar']]);
  });
});
