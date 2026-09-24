import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CLIENTE_PROPUESTAS, type ClientePropuestas } from '../src/clientes/propuestas';
import { ErrorDeApi } from '../src/clientes/http';
import ActividadFormularioVista from '../src/vistas/ActividadFormularioVista.vue';
import {
  abrirViaje,
  actividad,
  clienteAuthFalso,
  clienteViajesFalso,
  montaje,
} from './soporte/clientesFalsos';

const push = vi.fn();
let parametros: Record<string, string> = {};
vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => ({ params: parametros }),
}));

async function montar(cliente: Partial<ClientePropuestas>) {
  const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
    [CLIENTE_PROPUESTAS as symbol]: cliente,
  });
  await abrirViaje(opciones);
  // El mapa no se prueba acá: se reemplaza el campo de ubicación por uno que ya trae el punto.
  opciones.global.stubs = {
    ...opciones.global.stubs,
    CampoUbicacion: {
      props: ['modelValue'],
      emits: ['update:modelValue'],
      mounted() {
        (this as unknown as { $emit: (e: string, v: unknown) => void }).$emit('update:modelValue', {
          ubicacion: 'Bahía López',
          latitud: -41.08,
          longitud: -71.55,
        });
      },
      template: '<div />',
    },
  } as never;
  const vista = mount(ActividadFormularioVista, opciones);
  await flushPromises();
  return vista;
}

async function completar(vista: Awaited<ReturnType<typeof montar>>) {
  await vista.find('#actividad-titulo').setValue('Kayak');
  await vista.find('#actividad-descripcion').setValue('Salida guiada');
  await vista.find('#actividad-fecha').setValue('2026-12-11');
  await vista.find('#actividad-hora').setValue('11:00');
  await vista.find('#actividad-duracion').setValue('90');
}

beforeEach(() => {
  push.mockReset();
  parametros = {};
});

describe('ActividadFormularioVista', () => {
  it('CU10: propone con los datos del formulario y vuelve a la lista', async () => {
    const proponerActividad = vi.fn(async () => actividad('n', 'Kayak'));
    const vista = await montar({ proponerActividad });
    await completar(vista);
    await vista.find('form').trigger('submit');
    await flushPromises();
    expect(proponerActividad).toHaveBeenCalledWith('v1', {
      titulo: 'Kayak',
      descripcion: 'Salida guiada',
      ubicacion: 'Bahía López',
      latitud: -41.08,
      longitud: -71.55,
      fecha: '2026-12-11',
      horaInicio: '11:00',
      duracionMin: 90,
    });
    expect(push).toHaveBeenCalledWith('/viajes/v1/actividades');
  });

  it('valida antes de enviar', async () => {
    const proponerActividad = vi.fn();
    const vista = await montar({ proponerActividad });
    await vista.find('#actividad-duracion').setValue('0');
    await vista.find('form').trigger('submit');
    expect(proponerActividad).not.toHaveBeenCalled();
    expect(vista.text()).toContain('Ingresá un título');
    expect(vista.text()).toContain('La duración tiene que ser mayor que cero');
  });

  it('RN-A2: si choca con una confirmada, lista el conflicto y conserva lo cargado', async () => {
    const conflicto = {
      id: 'c',
      titulo: 'Cena',
      fecha: '2026-12-11',
      horaInicio: '10:00',
      duracionMin: 120,
    };
    const vista = await montar({
      proponerActividad: async () => {
        throw new ErrorDeApi(409, 'SUPERPOSICION_HORARIA', 'Se superpone', {
          conflictos: [conflicto],
        });
      },
    });
    await completar(vista);
    await vista.find('form').trigger('submit');
    await flushPromises();
    expect(vista.find('.aviso-superposicion').text()).toContain('Cena, 11/12/2026 · 10:00 a 12:00');
    expect((vista.find('#actividad-titulo').element as HTMLInputElement).value).toBe('Kayak');
    expect(push).not.toHaveBeenCalled();
  });

  it('CU11: en modo alternativa muestra la original, parte de su horario y propone sobre ella', async () => {
    parametros = { viajeId: 'v1', actividadId: 'k' };
    const original = actividad('k', 'Kayak', { horaInicio: '15:00', duracionMin: 45 });
    const proponerAlternativa = vi.fn(async () => actividad('t', 'Trekking'));
    const vista = await montar({ obtenerActividad: async () => original, proponerAlternativa });
    expect(vista.find('h2').text()).toBe('Proponer alternativa');
    expect(vista.find('.original').text()).toContain('Kayak');
    expect((vista.find('#actividad-hora').element as HTMLInputElement).value).toBe('15:00');
    expect((vista.find('#actividad-duracion').element as HTMLInputElement).value).toBe('45');
    await vista.find('#actividad-titulo').setValue('Trekking');
    await vista.find('#actividad-descripcion').setValue('Por el cerro');
    await vista.find('form').trigger('submit');
    await flushPromises();
    expect(proponerAlternativa).toHaveBeenCalledWith(
      'v1',
      'k',
      expect.objectContaining({ titulo: 'Trekking', horaInicio: '15:00', duracionMin: 45 }),
    );
  });
});
