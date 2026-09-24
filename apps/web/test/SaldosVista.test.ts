import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { CLIENTE_GASTOS } from '../src/clientes/gastos';
import SaldosVista from '../src/vistas/SaldosVista.vue';
import {
  abrirViaje,
  clienteAuthFalso,
  clienteGastosFalso,
  clienteViajesFalso,
  montaje,
} from './soporte/clientesFalsos';

const deuda = (id: string, nombre: string, monto: number) => ({
  id,
  contraparte: { id: nombre.toLowerCase(), nombre, apodo: null },
  monto,
  ultimaActualizacion: '2026-12-11T20:00:00.000Z',
});

describe('SaldosVista (CU21 y CU22)', () => {
  it('muestra lo que debo y lo que me deben, con sus totales', async () => {
    const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
      [CLIENTE_GASTOS as symbol]: clienteGastosFalso({
        deudas: async (_v, rol) =>
          rol === 'deudor'
            ? [deuda('d1', 'Tomás', 150_000)]
            : [deuda('d2', 'Luis', 30_000), deuda('d3', 'Sofía', 20_000)],
      }),
    });
    await abrirViaje(opciones);
    const vista = mount(SaldosVista, opciones);
    await flushPromises();
    const [debo, meDeben] = vista.findAll('[role="tab"]');
    expect(debo!.text()).toMatch(/Debo · \$\s?1\.500,00/);
    expect(meDeben!.text()).toMatch(/Me deben · \$\s?500,00/);
    expect(vista.findAll('.fila-saldo').map((f) => f.find('span').text())).toEqual(['Tomás']);
    await meDeben!.trigger('click');
    expect(vista.findAll('.fila-saldo').map((f) => f.find('span').text())).toEqual([
      'Luis',
      'Sofía',
    ]);
  });
});
