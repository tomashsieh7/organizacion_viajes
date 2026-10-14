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
  it('muestra el total, quién pagó y la parte de cada uno, con "vos" para el usuario', () => {
    const tarjeta = mount(TarjetaGasto, { props: { gasto: gasto(), moneda: ARS, miId: 'ana' } });
    expect(tarjeta.find('h3').text()).toBe('Cena');
    expect(tarjeta.find('strong').text()).toMatch(/\$\s?3\.000,00/);
    expect(tarjeta.find('.meta').text()).toContain('Comida · pagó vos · en partes iguales');
    expect(tarjeta.findAll('.partes li').map((li) => li.text())).toEqual([
      expect.stringMatching(/^vos: \$\s?1\.500,00$/),
      expect.stringMatching(/^Tomás \(Tomi\): \$\s?1\.500,00$/),
    ]);
  });

  it('indica la división arbitraria y nombra a quien pagó si no es el usuario', () => {
    const tarjeta = mount(TarjetaGasto, {
      props: { gasto: gasto({ modoDivision: 'ARBITRARIA' }), moneda: ARS, miId: 'tomas' },
    });
    expect(tarjeta.find('.meta').text()).toContain('pagó Ana · división indicada');
  });
});
