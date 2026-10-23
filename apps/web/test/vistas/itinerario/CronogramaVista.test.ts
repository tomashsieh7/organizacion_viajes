import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Cronograma } from '@viajes/compartido';
import { CLIENTE_ITINERARIO } from '../../../src/clientes/itinerario';
import CronogramaVista from '../../../src/vistas/itinerario/CronogramaVista.vue';
import {
  abrirViaje,
  clienteAuthFalso,
  clienteViajesFalso,
  montaje,
} from '../../soporte/clientesFalsos';

const replace = vi.fn(async (destino: { query: Record<string, string> }) => {
  consulta = destino.query;
});
let consulta: Record<string, string> = {};
vi.mock('vue-router', async () => {
  const { reactive } = await import('vue');
  const ruta = reactive({ query: {} as Record<string, string> });
  return {
    useRoute: () => {
      ruta.query = consulta;
      return ruta;
    },
    useRouter: () => ({
      replace: async (destino: { query: Record<string, string> }) => {
        await replace(destino);
        ruta.query = destino.query;
      },
    }),
  };
});

const cronograma: Cronograma = {
  dias: [
    {
      fecha: '2026-12-10',
      siguenDelDiaAnterior: [],
      actividades: [],
      alojamientos: [{ id: 'h', nombre: 'Hostel', ubicacion: 'Mitre 100' }],
    },
    {
      fecha: '2026-12-11',
      siguenDelDiaAnterior: [],
      actividades: [
        {
          id: 'k',
          titulo: 'Kayak',
          descripcion: 'x',
          fecha: '2026-12-11',
          horaInicio: '10:00',
          horaFin: '12:00',
          duracionMin: 120,
          ubicacion: 'Bahía López',
          latitud: -41,
          longitud: -71,
        },
      ],
      alojamientos: [],
    },
  ],
};

async function montar() {
  const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
    [CLIENTE_ITINERARIO as symbol]: { cronograma: async () => cronograma, mapa: vi.fn() },
  });
  opciones.global.stubs = {
    RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  } as never;
  await abrirViaje(opciones);
  const vista = mount(CronogramaVista, { ...opciones, attachTo: document.body });
  await flushPromises();
  return vista;
}

afterEach(() => {
  consulta = {};
  replace.mockClear();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('CronogramaVista', () => {
  it('RN-C1 a RN-C3: el día elegido muestra su leyenda, actividades con enlace al mapa y noche', async () => {
    consulta = { dia: '2026-12-10' };
    const vista = await montar();
    // Un solo día a la vista: el que se eligió en el calendario.
    expect(vista.findAll('.dia')).toHaveLength(1);
    expect(vista.find('.dia').text()).toContain('Sin actividades confirmadas');
    expect(vista.find('.dia').text()).toContain('Noche en Hostel (Mitre 100)');

    await vista.find('[data-fecha="2026-12-11"]').trigger('click');
    await flushPromises();
    expect(replace).toHaveBeenCalledWith({ query: { dia: '2026-12-11' } });
    const dia = vista.find('.dia');
    const fila = dia.find('.agenda__fila');
    expect(fila.find('.agenda__hora').text()).toBe('10:00 a 12:00');
    expect(fila.find('strong').text()).toBe('Kayak');
    expect(fila.find('.agenda__detalle').text()).toContain('Bahía López');
    expect(dia.find('a').attributes('href')).toBe('/viajes/v1/mapa?actividad=k');
    expect(dia.text()).not.toContain('Noche en');
  });

  it('RN-C1: el calendario ofrece todos los días del viaje y marca los que tienen actividades', async () => {
    const vista = await montar();
    expect(vista.findAll('button.calendario__dia')).toHaveLength(7);
    expect(vista.find('.calendario__dia--con-actividad').attributes('data-fecha')).toBe(
      '2026-12-11',
    );
  });

  it('RN-C4: abre en hoy si cae dentro del viaje', async () => {
    vi.useFakeTimers({ now: new Date(2026, 11, 10, 9, 0), toFake: ['Date'] });
    const vista = await montar();
    expect(vista.find('[aria-pressed="true"]').attributes('data-fecha')).toBe('2026-12-10');
    expect(vista.find('#dia-2026-12-10').classes()).toContain('hoy');
  });

  it('RN-C4 con la regla de RN-M1: fuera del viaje, abre en el primer día con actividades', async () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 14, 9, 0), toFake: ['Date'] });
    const vista = await montar();
    expect(vista.find('[aria-pressed="true"]').attributes('data-fecha')).toBe('2026-12-11');
    // El día que se abrió queda en la dirección, para conservarlo al pasar al mapa.
    expect(replace).toHaveBeenCalledWith({ query: { dia: '2026-12-11' } });
  });

  it('un ?dia= que no es del viaje se ignora', async () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 14, 9, 0), toFake: ['Date'] });
    consulta = { dia: '2027-01-01' };
    const vista = await montar();
    expect(vista.find('[aria-pressed="true"]').attributes('data-fecha')).toBe('2026-12-11');
  });
});
