import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MapaDelDia } from '@viajes/compartido';
import { CLIENTE_ITINERARIO, type ClienteItinerario } from '../src/clientes/itinerario';
import { CLIENTE_PROPUESTAS, type ClientePropuestas } from '../src/clientes/propuestas';
import MapaVista from '../src/vistas/MapaVista.vue';
import {
  abrirViaje,
  actividad,
  clienteAuthFalso,
  clienteViajesFalso,
  montaje,
} from './soporte/clientesFalsos';

const replace = vi.fn();
let consulta: Record<string, string> = {};
vi.mock('vue-router', () => ({
  useRouter: () => ({ replace }),
  useRoute: () => ({ query: consulta }),
}));

const kayak = {
  id: 'k',
  titulo: 'Kayak',
  descripcion: 'Salida guiada',
  fecha: '2026-12-12',
  horaInicio: '10:00',
  horaFin: '12:00',
  duracionMin: 120,
  ubicacion: 'Bahía López',
  latitud: -41.08,
  longitud: -71.55,
};
const mapaDe = (dia: string, conKayak: boolean): MapaDelDia => ({
  dia,
  diasConActividad: ['2026-12-12'],
  actividades: conKayak ? [kayak] : [],
  recorrido: conKayak ? [{ latitud: kayak.latitud, longitud: kayak.longitud }] : [],
  aviso: conKayak ? null : 'SIN_ACTIVIDADES_CONFIRMADAS',
});

async function montar(
  mapa: ClienteItinerario['mapa'],
  propuestas: Partial<ClientePropuestas> = {},
) {
  const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
    [CLIENTE_ITINERARIO as symbol]: { mapa, cronograma: vi.fn() },
    [CLIENTE_PROPUESTAS as symbol]: propuestas,
  });
  opciones.global.stubs = { ...opciones.global.stubs, MapaActividades: true } as never;
  await abrirViaje(opciones);
  const vista = mount(MapaVista, opciones);
  await flushPromises();
  return vista;
}

beforeEach(() => {
  consulta = {};
  replace.mockReset();
});

describe('MapaVista', () => {
  it('RN-M1: sin día pide el mapa con la fecha del dispositivo y muestra el aviso si está vacío', async () => {
    vi.useFakeTimers({ now: new Date(2026, 11, 11, 9, 0), toFake: ['Date'] });
    const mapa = vi.fn(async () => mapaDe('2026-12-11', false));
    const vista = await montar(mapa);
    vi.useRealTimers();
    expect(mapa).toHaveBeenCalledWith('v1', '2026-12-11', undefined);
    expect(vista.find('[role="status"]').text()).toContain('no tiene actividades confirmadas');
    // RN-M7: el selector ofrece todos los días y resalta los que tienen actividades.
    const botones = vista.findAll('.selector-dia button');
    expect(botones).toHaveLength(7);
    expect(vista.find('.selector-dia .con-actividad').text()).toContain('12/12');
    expect(vista.find('.selector-dia [aria-pressed="true"]').text()).toContain('11/12');
  });

  it('RN-M7: al elegir otro día lo guarda en la dirección y lo carga', async () => {
    const mapa = vi.fn(async (_v: string, _h: string, dia?: string) =>
      mapaDe(dia ?? '2026-12-10', dia === '2026-12-12'),
    );
    const vista = await montar(mapa);
    await vista.find('.selector-dia .con-actividad').trigger('click');
    await flushPromises();
    expect(replace).toHaveBeenCalledWith({ query: { dia: '2026-12-12' } });
    expect(mapa).toHaveBeenLastCalledWith('v1', expect.any(String), '2026-12-12');
    expect(vista.find('.orden').text()).toContain('10:00 · Kayak');
    expect(vista.find('[role="status"]').exists()).toBe(false);
  });

  it('RN-M8: con ?actividad= abre el día de esa actividad con su panel', async () => {
    consulta = { actividad: 'k' };
    const mapa = vi.fn(async (_v: string, _h: string, dia?: string) => mapaDe(dia!, true));
    const obtenerActividad = vi.fn(async () => actividad('k', 'Kayak', { estado: 'CONFIRMADA' }));
    const vista = await montar(mapa, { obtenerActividad });
    expect(obtenerActividad).toHaveBeenCalledWith('v1', 'k');
    expect(mapa).toHaveBeenCalledWith('v1', expect.any(String), '2026-12-11');
    const panel = vista.find('.panel-actividad');
    expect(panel.text()).toContain('Kayak');
    expect(panel.text()).toContain('Bahía López');
    expect(panel.find('.numero').text()).toBe('1');
    await panel.find('button').trigger('click');
    expect(vista.find('.panel-actividad').exists()).toBe(false);
  });

  it('RN-M8: si la actividad no está confirmada, muestra el panel con la aclaración', async () => {
    consulta = { actividad: 'p' };
    const vista = await montar(async (_v, _h, dia) => mapaDe(dia!, false), {
      obtenerActividad: async () => actividad('p', 'Pendiente'),
    });
    expect(vista.find('.panel-actividad').text()).toContain('no está confirmada');
  });
});
