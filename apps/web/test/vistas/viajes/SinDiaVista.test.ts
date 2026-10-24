import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import SinDiaVista from '../../../src/vistas/viajes/SinDiaVista.vue';
import { CLIENTE_PROPUESTAS } from '../../../src/clientes/propuestas';
import {
  abrirViaje,
  actividad,
  clienteAuthFalso,
  clientePropuestasFalso,
  clienteViajesFalso,
  detalle,
  montaje,
} from '../../soporte/clientesFalsos';

async function montar(rol: 'ADMIN' | 'VIAJERO' = 'ADMIN') {
  const kayak = actividad('a1', 'Kayak');
  kayak.actividad.fecha = null;
  const votar = vi.fn(async () => ({ ...kayak, votosAFavor: 1, miVoto: 'A_FAVOR' as const }));
  const ubicar = vi.fn(async (_v: string, _id: string, _tipo: string, fecha: string) => {
    kayak.actividad.fecha = fecha;
  });
  const cliente = clientePropuestasFalso({ listarActividades: async () => [kayak], ubicar, votar });
  const opciones = montaje(
    clienteAuthFalso(),
    clienteViajesFalso({ obtener: async () => detalle(rol) }),
    { [CLIENTE_PROPUESTAS as symbol]: cliente },
  );
  await abrirViaje(opciones);
  const vista = mount(SinDiaVista, opciones);
  await flushPromises();
  return { vista, ubicar, votar };
}

describe('CU28: bandeja Sin día', () => {
  it('RN-V6: conserva la votación, pero no permite confirmar una pendiente sin fecha', async () => {
    const { vista, votar } = await montar();
    expect(vista.text()).toContain('Kayak');
    expect(vista.text()).toContain('Ubicar en un día');
    expect(vista.findAll('button').some((b) => b.text() === 'Confirmar')).toBe(false);
    await vista.get('[aria-label="A favor"]').trigger('click');
    await flushPromises();
    expect(votar).toHaveBeenCalledWith('v1', 'a1', 'A_FAVOR');
    vista.unmount();
  });

  it('CU28 y RN-V7: el Admin elige la fecha y la propuesta sale de la bandeja', async () => {
    const { vista, ubicar } = await montar();
    await vista
      .findAll('button')
      .find((b) => b.text() === 'Ubicar en un día')!
      .trigger('click');
    await vista.get('#ubicar-fecha').setValue('2026-12-12');
    await vista.get('form').trigger('submit');
    await flushPromises();
    expect(ubicar).toHaveBeenCalledWith('v1', 'a1', 'ACTIVIDAD', '2026-12-12');
    expect(vista.text()).toContain('No hay propuestas sin día.');
    expect(vista.find('[role="dialog"]').exists()).toBe(false);
    vista.unmount();
  });

  it('RN-V7: los viajeros consultan y votan sin botones para ubicar o resolver', async () => {
    const { vista } = await montar('VIAJERO');
    expect(vista.text()).toContain('Kayak');
    expect(vista.text()).not.toContain('Ubicar en un día');
    expect(vista.text()).not.toContain('Denegar');
    expect(vista.find('[aria-label="A favor"]').exists()).toBe(true);
    vista.unmount();
  });
});
