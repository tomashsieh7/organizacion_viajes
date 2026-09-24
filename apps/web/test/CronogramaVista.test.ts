import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Cronograma } from '@viajes/compartido';
import { CLIENTE_ITINERARIO } from '../src/clientes/itinerario';
import CronogramaVista from '../src/vistas/CronogramaVista.vue';
import {
  abrirViaje,
  clienteAuthFalso,
  clienteViajesFalso,
  montaje,
} from './soporte/clientesFalsos';

const cronograma: Cronograma = {
  dias: [
    {
      fecha: '2026-12-10',
      actividades: [],
      alojamientos: [{ id: 'h', nombre: 'Hostel', ubicacion: 'Mitre 100' }],
    },
    {
      fecha: '2026-12-11',
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
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('CronogramaVista', () => {
  it('RN-C1 a RN-C3: días vacíos con leyenda, actividades con enlace al mapa y noche de alojamiento', async () => {
    const vista = await montar();
    const [primero, segundo] = vista.findAll('.dia');
    expect(primero!.text()).toContain('Sin actividades confirmadas');
    expect(primero!.text()).toContain('Noche en Hostel (Mitre 100)');
    expect(segundo!.text()).toContain('10:00 a 12:00');
    expect(segundo!.find('a').attributes('href')).toBe('/viajes/v1/mapa?actividad=k');
    expect(segundo!.text()).not.toContain('Noche en');
  });

  it('RN-C4: se desplaza hasta hoy si cae dentro del viaje', async () => {
    vi.useFakeTimers({ now: new Date(2026, 11, 11, 9, 0), toFake: ['Date'] });
    const desplazar = vi.fn();
    Element.prototype.scrollIntoView = desplazar;
    const vista = await montar();
    expect(desplazar).toHaveBeenCalledTimes(1);
    expect(desplazar.mock.contexts[0]).toBe(vista.find('#dia-2026-12-11').element);
    expect(vista.find('#dia-2026-12-11').classes()).toContain('hoy');
  });
});
