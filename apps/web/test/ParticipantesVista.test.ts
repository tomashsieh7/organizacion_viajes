import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import ParticipantesVista from '../src/vistas/ParticipantesVista.vue';
import { useSesionStore } from '../src/stores/sesion';
import { useViajeStore } from '../src/stores/viaje';
import { clienteAuthFalso, clienteViajesFalso, detalle, montaje } from './soporte/clientesFalsos';

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));

async function montarComo(miRol: 'ADMIN' | 'VIAJERO', miId: string, extra = {}) {
  const viajes = clienteViajesFalso({ obtener: async () => detalle(miRol, 150_000), ...extra });
  const opciones = montaje(clienteAuthFalso(), viajes);
  const vista = mount(ParticipantesVista, opciones);
  useSesionStore().usuario = { id: miId, nombre: 'Yo', apodo: null };
  // Como en ViajeLayout: la vista trabaja sobre un viaje ya abierto.
  await useViajeStore().abrir('v1');
  await useViajeStore().cargarParticipantes();
  await flushPromises();
  return vista;
}

describe('ParticipantesVista', () => {
  it('muestra al Admin el formulario para agregar y el traspaso', async () => {
    const vista = await montarComo('ADMIN', 'ana');
    expect(vista.find('#agregar-email').exists()).toBe(true);
    expect(vista.text()).toContain('Transferir la administración');
    expect(vista.text()).toContain('Eliminar');
  });

  it('a un viajero común no le muestra acciones de Admin', async () => {
    const vista = await montarComo('VIAJERO', 'tomas');
    expect(vista.find('#agregar-email').exists()).toBe(false);
    expect(vista.text()).not.toContain('Transferir la administración');
    expect(vista.text()).not.toContain('Eliminar');
    expect(vista.text()).toContain('Salir del grupo');
  });

  it('RN-E7: al salir con deuda se muestra cuánto debe antes de confirmar', async () => {
    const vista = await montarComo('VIAJERO', 'tomas');
    await vista
      .findAll('button')
      .find((b) => b.text() === 'Salir del grupo')!
      .trigger('click');
    expect(vista.text()).toMatch(/Todavía debés \$\s?1\.500,00/);
  });

  it('RN-T3: el Admin no puede confirmar la salida sin elegir sucesor', async () => {
    const salir = vi.fn();
    const vista = await montarComo('ADMIN', 'ana', { salir });
    await vista
      .findAll('button')
      .find((b) => b.text() === 'Salir del grupo')!
      .trigger('click');
    const confirmar = vista
      .findAll('[role="dialog"] button')
      .find((b) => b.text() === 'Salir del grupo')!;
    await confirmar.trigger('click');
    expect(salir).not.toHaveBeenCalled();
    expect(vista.text()).toContain('tenés que elegir quién va a ser el nuevo Admin');
  });
});
