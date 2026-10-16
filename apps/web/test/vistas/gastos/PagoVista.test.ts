import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { DeudaVista } from '@viajes/compartido';
import { CLIENTE_GASTOS, type ClienteGastos } from '../../../src/clientes/gastos';
import { ErrorDeApi } from '../../../src/clientes/http';
import { useGastosStore } from '../../../src/stores/gastos';
import { useCelebracion } from '../../../src/composables/useCelebracion';
import PagoVista from '../../../src/vistas/gastos/PagoVista.vue';
import {
  abrirViaje,
  clienteAuthFalso,
  clienteGastosFalso,
  clienteViajesFalso,
  montaje,
} from '../../soporte/clientesFalsos';

vi.mock('vue-router', () => ({
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

  it('registra el pago y muestra el comprobante con lo que queda por pagar', async () => {
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
    const comprobante = vista.find('.comprobante');
    expect(comprobante.attributes('role')).toBe('status');
    expect(comprobante.find('h3').text()).toBe('Pago registrado');
    expect(comprobante.find('.comprobante__monto').text()).toMatch(/\$\s?400,00/);
    expect(comprobante.text()).toContain('Ana');
    expect(comprobante.text()).toMatch(/Te queda por pagarle\s*\$\s?600,00/);
    expect(comprobante.find('a').text()).toBe('Listo');
    expect(comprobante.find('a').attributes('to')).toBe('/viajes/v1/saldos');
    expect(vista.find('form').exists()).toBe(false);
    expect(useGastosStore().debo[0]?.monto).toBe(60_000);
  });

  it('pago total: el comprobante dice que la deuda quedó saldada y se celebra', async () => {
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
    expect(vista.find('.comprobante h3').text()).toBe('¡Deuda saldada!');
    expect(vista.find('.comprobante').text()).toMatch(/Te queda por pagarle\s*Nada/);
    expect(useCelebracion().celebracion.value?.mensaje).toBe('¡Cuentas saldadas con Ana!');
    useCelebracion().cerrar();
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
    expect(vista.find('.comprobante').exists()).toBe(false);
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
