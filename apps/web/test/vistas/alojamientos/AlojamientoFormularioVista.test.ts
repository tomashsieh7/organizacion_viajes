import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CLIENTE_PROPUESTAS, type ClientePropuestas } from '../../../src/clientes/propuestas';
import { ErrorDeApi } from '../../../src/clientes/http';
import AlojamientoFormularioVista from '../../../src/vistas/alojamientos/AlojamientoFormularioVista.vue';
import {
  abrirViaje,
  clienteAuthFalso,
  clienteViajesFalso,
  montaje,
} from '../../soporte/clientesFalsos';

const push = vi.fn();
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }));

async function montar(proponerAlojamiento: ClientePropuestas['proponerAlojamiento']) {
  const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
    [CLIENTE_PROPUESTAS as symbol]: { proponerAlojamiento },
  });
  await abrirViaje(opciones);
  // El mapa no se prueba acá: el campo de ubicación se reemplaza por uno que ya trae el lugar.
  opciones.global.stubs = {
    ...opciones.global.stubs,
    CampoUbicacion: {
      props: ['modelValue'],
      emits: ['update:modelValue'],
      mounted() {
        (this as unknown as { $emit: (e: string, v: unknown) => void }).$emit('update:modelValue', {
          ubicacion: 'Mitre 100',
          latitud: -41.13,
          longitud: -71.31,
        });
      },
      template: '<div />',
    },
  } as never;
  const vista = mount(AlojamientoFormularioVista, opciones);
  await flushPromises();
  return vista;
}

async function completar(vista: Awaited<ReturnType<typeof montar>>, precio = '48.000,50') {
  await vista.find('#alojamiento-nombre').setValue('Hostel Patagonia');
  await vista.find('#alojamiento-descripcion').setValue('Con desayuno');
  await vista.find('#alojamiento-precio').setValue(precio);
  await vista.find('form').trigger('submit');
  await flushPromises();
}

beforeEach(() => push.mockReset());

describe('AlojamientoFormularioVista (CU05)', () => {
  it('propone el alojamiento con el precio en centavos y vuelve a la lista', async () => {
    const proponer = vi.fn(async () => ({}) as never);
    const vista = await montar(proponer);
    await completar(vista);
    expect(proponer).toHaveBeenCalledWith('v1', {
      nombre: 'Hostel Patagonia',
      descripcion: 'Con desayuno',
      fechaDesde: '2026-12-10',
      fechaHasta: '2026-12-16',
      ubicacion: 'Mitre 100',
      latitud: -41.13,
      longitud: -71.31,
      precio: 4_800_050,
    });
    expect(push).toHaveBeenCalledWith('/viajes/v1/alojamientos');
  });

  it('rechaza un precio con formato inválido sin llamar a la API', async () => {
    const proponer = vi.fn();
    const vista = await montar(proponer);
    await completar(vista, 'mucho');
    expect(proponer).not.toHaveBeenCalled();
    expect(vista.text()).toContain('Ingresá un monto válido');
  });

  it('RN-X4: muestra el error de la API junto al campo de fechas', async () => {
    const vista = await montar(
      vi.fn(async () => {
        throw new ErrorDeApi(400, 'VALIDACION', 'Datos inválidos', [
          { campo: 'fechaHasta', mensaje: 'La salida tiene que estar dentro del viaje' },
        ]);
      }),
    );
    await completar(vista);
    expect(vista.text()).toContain('La salida tiene que estar dentro del viaje');
    expect(push).not.toHaveBeenCalled();
  });
});
