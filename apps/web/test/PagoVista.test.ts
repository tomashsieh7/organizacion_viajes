import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DeudaVista } from '@viajes/compartido';
import { CLIENTE_GASTOS, type ClienteGastos } from '../src/clientes/gastos';
import { ErrorDeApi } from '../src/clientes/http';
import { useGastosStore } from '../src/stores/gastos';
import PagoVista from '../src/vistas/PagoVista.vue';
import {
  abrirViaje,
  clienteAuthFalso,
  clienteGastosFalso,
  clienteViajesFalso,
  montaje,
} from './soporte/clientesFalsos';

const push = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => ({ params: { viajeId: 'v1', acreedorId: 'ana' } }),
}));

const deudaConAna = (monto: number): DeudaVista => ({
  id: 'd1',
  contraparte: { id: 'ana', nombre: 'Ana', apodo: null },
  monto,
  ultimaActualizacion: '2026-12-11T20:00:00.000Z',
  pagos: [],
});

async function montar(parcial: Partial<ClienteGastos>) {
  const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
    [CLIENTE_GASTOS as symbol]: clienteGastosFalso(parcial),
  });
  await abrirViaje(opciones);
  const vista = mount(PagoVista, opciones);
  await flushPromises();
  return vista;
}

beforeEach(() => push.mockReset());

describe('PagoVista (CU23)', () => {
  it('RN-P2: muestra lo que se debe y "Pagar el total" completa el monto', async () => {
    const vista = await montar({
      deudas: async (_v, rol) => (rol === 'deudor' ? [deudaConAna(150_050)] : []),
    });
    expect(vista.find('.saldo').text()).toMatch(/Le debés \$\s?1\.500,50 a Ana/);
    await vista.find('button[type="button"]').trigger('click');
    expect((vista.find('#pago-monto').element as HTMLInputElement).value).toBe('1500,50');
  });

  it('RN-P4: avisa mientras se escribe si el monto supera la deuda y no deja pagar', async () => {
    const pagar = vi.fn();
    const vista = await montar({
      deudas: async (_v, rol) => (rol === 'deudor' ? [deudaConAna(100_000)] : []),
      pagar,
    });
    await vista.find('#pago-monto').setValue('1000,01');
    expect(vista.find('.aviso-excede').text()).toMatch(/saldo pendiente es \$\s?1\.000,00/);
    expect(vista.find('button[type="submit"]').attributes('disabled')).toBeDefined();
    await vista.find('#pago-monto').setValue('1000');
    expect(vista.find('.aviso-excede').exists()).toBe(false);
  });

  it('registra el pago, vuelve a los saldos y deja la confirmación con lo que queda', async () => {
    let saldo = 100_000;
    const pagar = vi.fn<ClienteGastos['pagar']>(async (_v, d) => {
      saldo -= d.monto;
      return {
        saldo,
        pago: {
          id: 'p1',
          monto: d.monto,
          fecha: '',
          registradoPor: { id: 'yo', nombre: 'Yo', apodo: null },
        },
      };
    });
    const vista = await montar({
      deudas: async (_v, rol) => (rol === 'deudor' ? [deudaConAna(saldo)] : []),
      pagar,
    });
    await vista.find('#pago-monto').setValue('400');
    await vista.find('form').trigger('submit');
    await flushPromises();
    expect(pagar).toHaveBeenCalledWith('v1', { acreedorId: 'ana', monto: 40_000 });
    expect(push).toHaveBeenCalledWith('/viajes/v1/saldos');
    expect(useGastosStore().mensaje).toMatch(/Todavía le debés \$\s?600,00 a Ana/);
    expect(useGastosStore().debo[0]?.monto).toBe(60_000);
  });

  it('pago total: la deuda deja de estar en la lista y confirma que quedó saldada', async () => {
    let saldo = 100_000;
    const vista = await montar({
      deudas: async (_v, rol) => (rol === 'deudor' && saldo > 0 ? [deudaConAna(saldo)] : []),
      pagar: async (_v, d) => {
        saldo -= d.monto;
        return {
          saldo,
          pago: {
            id: 'p1',
            monto: d.monto,
            fecha: '',
            registradoPor: { id: 'yo', nombre: 'Yo', apodo: null },
          },
        };
      },
    });
    await vista.find('button[type="button"]').trigger('click');
    await vista.find('form').trigger('submit');
    await flushPromises();
    expect(push).toHaveBeenCalledWith('/viajes/v1/saldos');
    expect(useGastosStore().mensaje).toBe('Saldaste tu deuda con Ana.');
    expect(useGastosStore().debo).toEqual([]);
  });

  it('si otro pago cambió el saldo, lo vuelve a leer y muestra el aviso con el saldo nuevo', async () => {
    let saldo = 100_000;
    const vista = await montar({
      deudas: async (_v, rol) => (rol === 'deudor' ? [deudaConAna(saldo)] : []),
      pagar: async () => {
        saldo = 30_000;
        throw new ErrorDeApi(422, 'PAGO_EXCEDE_DEUDA', 'Excede', { saldo });
      },
    });
    await vista.find('#pago-monto').setValue('500');
    await vista.find('form').trigger('submit');
    await flushPromises();
    expect(push).not.toHaveBeenCalled();
    expect(vista.find('.aviso-excede').text()).toMatch(/\$\s?300,00/);
  });

  it('RN-P3: el monto tiene que ser mayor que cero', async () => {
    const pagar = vi.fn();
    const vista = await montar({
      deudas: async (_v, rol) => (rol === 'deudor' ? [deudaConAna(100_000)] : []),
      pagar,
    });
    for (const texto of ['', '0', 'abc']) {
      await vista.find('#pago-monto').setValue(texto);
      await vista.find('form').trigger('submit');
      expect(vista.text()).toContain('Ingresá un monto mayor que cero');
    }
    expect(pagar).not.toHaveBeenCalled();
  });

  it('sin deuda con esa persona lo informa', async () => {
    const vista = await montar({ deudas: async () => [] });
    expect(vista.text()).toContain('No tenés una deuda pendiente con esa persona');
  });
});
