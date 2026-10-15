import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { CLIENTE_GASTOS } from '../src/clientes/gastos';
import SaldosVista from '../src/vistas/SaldosVista.vue';
import {
  abrirViaje,
  clienteAuthFalso,
  clienteGastosFalso,
  clienteViajesFalso,
  errorDeApi,
  montaje,
} from './soporte/clientesFalsos';

let consulta: Record<string, string> = {};
vi.mock('vue-router', () => ({ useRoute: () => ({ query: consulta }) }));

const deuda = (id: string, nombre: string, monto: number) => ({
  id,
  contraparte: { id: nombre.toLowerCase(), nombre, apodo: null },
  monto,
  ultimaActualizacion: '2026-12-11T20:00:00.000Z',
  pagos: [],
});

describe('SaldosVista (CU21 y CU22)', () => {
  it('si no cargan los saldos muestra el error con Reintentar, sin totales en cero', async () => {
    let falla = true;
    const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
      [CLIENTE_GASTOS as symbol]: clienteGastosFalso({
        deudas: async (_v, rol) => {
          if (falla) throw errorDeApi('SIN_CONEXION', 'No se pudo contactar al servidor', 0);
          return rol === 'deudor' ? [deuda('d1', 'Tomás', 150_000)] : [];
        },
      }),
    });
    await abrirViaje(opciones);
    const vista = mount(SaldosVista, opciones);
    await flushPromises();
    expect(vista.get('[role="alert"]').text()).toContain('No se pudo contactar al servidor');
    expect(vista.text()).not.toContain('$');
    expect(vista.text()).not.toContain('No le debés nada');

    falla = false;
    await vista.get('[role="alert"] button').trigger('click');
    await flushPromises();
    expect(vista.find('[role="alert"]').exists()).toBe(false);
    expect(vista.findAll('.fila-saldo').map((f) => f.find('span').text())).toEqual(['Tomás']);
  });

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
    // Los dos puntos son solo para lectores de pantalla: separan el rótulo del monto.
    expect(debo!.text()).toMatch(/^Debo:\s*\$\s?1\.500,00$/);
    expect(meDeben!.text()).toMatch(/^Me deben:\s*\$\s?500,00$/);
    expect(debo!.find('.pestana__total--cero').exists()).toBe(false);
    expect(vista.findAll('.fila-saldo').map((f) => f.find('span').text())).toEqual(['Tomás']);
    await meDeben!.trigger('click');
    expect(vista.findAll('.fila-saldo').map((f) => f.find('span').text())).toEqual([
      'Luis',
      'Sofía',
    ]);
  });

  it('RN-P1 y RN-P6: "Pagar" solo en las deudas propias y el historial en ambos lados', async () => {
    const pago = {
      id: 'p1',
      monto: 50_000,
      fecha: '2026-12-12T10:00:00.000Z',
      registradoPor: { id: 'tomas', nombre: 'Tomás', apodo: 'Tomi' },
    };
    const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
      [CLIENTE_GASTOS as symbol]: clienteGastosFalso({
        deudas: async (_v, rol) =>
          rol === 'deudor'
            ? [{ ...deuda('d1', 'Tomás', 150_000), pagos: [pago] }]
            : [deuda('d2', 'Luis', 30_000)],
      }),
    });
    opciones.global.stubs = {
      RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
    } as never;
    await abrirViaje(opciones);
    const vista = mount(SaldosVista, opciones);
    await flushPromises();
    const fila = vista.find('.fila-saldo');
    expect(fila.find('a').text()).toBe('Pagar');
    expect(fila.find('a').attributes('href')).toBe('/viajes/v1/saldos/pagar/tomás');
    expect(fila.find('.pagos summary').text()).toBe('Pagos (1)');
    expect(fila.find('.pagos li').text()).toMatch(/\$\s?500,00 · registrado por Tomás \(Tomi\)/);
    await vista.findAll('[role="tab"]')[1]!.trigger('click');
    expect(vista.find('.fila-saldo a').exists()).toBe(false);
  });

  it('un total en cero se muestra en gris, sin el color de deuda ni de crédito', async () => {
    const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
      [CLIENTE_GASTOS as symbol]: clienteGastosFalso({
        deudas: async (_v, rol) => (rol === 'deudor' ? [] : [deuda('d2', 'Luis', 30_000)]),
      }),
    });
    await abrirViaje(opciones);
    const vista = mount(SaldosVista, opciones);
    await flushPromises();
    const [debo, meDeben] = vista.findAll('[role="tab"]');
    expect(debo!.find('.pestana__total').classes()).toContain('pestana__total--cero');
    expect(meDeben!.find('.pestana__total').classes()).not.toContain('pestana__total--cero');
  });

  it('con ?ver=meDeben, desde los accesos rápidos de Gastos, abre esa pestaña', async () => {
    consulta = { ver: 'meDeben' };
    const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
      [CLIENTE_GASTOS as symbol]: clienteGastosFalso({
        deudas: async (_v, rol) => (rol === 'deudor' ? [] : [deuda('d2', 'Luis', 30_000)]),
      }),
    });
    await abrirViaje(opciones);
    const vista = mount(SaldosVista, opciones);
    await flushPromises();
    consulta = {};
    const [, meDeben] = vista.findAll('[role="tab"]');
    expect(meDeben!.attributes('aria-selected')).toBe('true');
    expect(vista.findAll('.fila-saldo').map((f) => f.find('span').text())).toEqual(['Luis']);
  });
});
