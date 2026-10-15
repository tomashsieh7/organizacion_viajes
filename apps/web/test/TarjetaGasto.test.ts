import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { GastoVista } from '@viajes/compartido';
import TarjetaGasto from '../src/componentes/gastos/TarjetaGasto.vue';

const ARS = { codigo: 'ARS', nombre: 'Peso argentino', decimales: 2 };
const ana = { id: 'ana', nombre: 'Ana', apodo: null };
const tomas = { id: 'tomas', nombre: 'Tomás', apodo: 'Tomi' };

function gasto(parcial: Partial<GastoVista> = {}): GastoVista {
  return {
    id: 'g1',
    titulo: 'Cena',
    categoria: { id: 'c1', codigo: 'COMIDA', nombre: 'Comida' },
    monto: 300_000,
    modoDivision: 'IGUALES',
    pagadoPor: ana,
    registradoPor: ana,
    creadoEn: '2026-12-11T20:00:00.000Z',
    partes: [
      { usuario: ana, monto: 150_000 },
      { usuario: tomas, monto: 150_000 },
    ],
    ...parcial,
  } as GastoVista;
}

describe('TarjetaGasto', () => {
  it('como movimiento: ícono de la categoría, quién pagó, tu parte y el total', () => {
    const tarjeta = mount(TarjetaGasto, { props: { gasto: gasto(), moneda: ARS, miId: 'ana' } });
    expect(tarjeta.find('.gasto__titulo').text()).toBe('Cena');
    expect(tarjeta.find('summary .monto').text()).toMatch(/\$\s?3\.000,00/);
    expect(tarjeta.find('summary .meta').text()).toMatch(/^Pagaste vos · tu parte \$\s?1\.500,00$/);
    expect(tarjeta.find('.gasto__icono').attributes('title')).toBe('Comida');
    // El reparto completo queda plegado.
    expect(tarjeta.find('details').attributes('open')).toBeUndefined();
    expect(tarjeta.find('.detalle .meta').text()).toBe('Comida · en partes iguales');
    expect(tarjeta.findAll('.partes li').map((li) => li.text())).toEqual([
      expect.stringMatching(/^vos: \$\s?1\.500,00$/),
      expect.stringMatching(/^Tomás \(Tomi\): \$\s?1\.500,00$/),
    ]);
  });

  it('nombra a quien pagó, indica la división arbitraria y avisa si no participás', () => {
    const otro = { id: 'luis', nombre: 'Luis', apodo: null };
    const tarjeta = mount(TarjetaGasto, {
      props: { gasto: gasto({ modoDivision: 'ARBITRARIA' }), moneda: ARS, miId: 'tomas' },
    });
    expect(tarjeta.find('summary .meta').text()).toMatch(/^Pagó Ana · tu parte/);
    expect(tarjeta.find('.detalle .meta').text()).toBe('Comida · división indicada');
    const ajeno = mount(TarjetaGasto, { props: { gasto: gasto(), moneda: ARS, miId: otro.id } });
    expect(ajeno.find('summary .meta').text()).toBe('Pagó Ana · no participás');
  });
});
