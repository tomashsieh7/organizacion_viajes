import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResumenViaje } from '@viajes/compartido';
import DialogoNuevoViaje from '../src/componentes/viajes/DialogoNuevoViaje.vue';
import { useViajeStore } from '../src/stores/viaje';
import ViajesVista from '../src/vistas/ViajesVista.vue';
import { clienteAuthFalso, clienteViajesFalso, montaje } from './soporte/clientesFalsos';

const push = vi.fn();
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }));

const viaje = (id: string, cambios: Partial<ResumenViaje> = {}): ResumenViaje => ({
  id,
  nombre: 'Bariloche 2026',
  destino: 'Bariloche',
  fechaInicio: '2026-12-10',
  fechaFin: '2026-12-16',
  monedaCodigo: 'ARS',
  miRol: 'VIAJERO',
  miAcceso: 'COMPLETO',
  ...cambios,
});

async function montar(viajes: ResumenViaje[]) {
  const opciones = montaje(clienteAuthFalso(), clienteViajesFalso({ listar: async () => viajes }));
  const vista = mount(ViajesVista, opciones);
  await flushPromises();
  return vista;
}

beforeEach(() => {
  // La cuenta regresiva depende de la fecha del dispositivo.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-14T12:00:00'));
});
afterEach(() => {
  vi.useRealTimers();
  push.mockReset();
});

describe('ViajesVista', () => {
  it('cada tarjeta muestra destino, fechas, rol y la cuenta regresiva', async () => {
    const vista = await montar([
      viaje('v1', { miRol: 'ADMIN' }),
      viaje('v2', { nombre: 'Mendoza', miAcceso: 'SOLO_SALDOS' }),
    ]);
    const tarjetas = vista.findAll('.tarjeta');
    expect(tarjetas[0]!.text()).toContain('Bariloche');
    expect(tarjetas[0]!.text()).toContain('10 al 16 dic 2026');
    expect(tarjetas[0]!.text()).toContain('Admin');
    expect(tarjetas[0]!.find('.tarjeta__cuenta').text()).toBe('Faltan 57 días');
    expect(tarjetas[1]!.text()).toContain('Solo saldos');
  });

  it('muestra el aviso pendiente una sola vez', async () => {
    const vista = await montar([viaje('v1')]);
    useViajeStore().avisoLista = 'Saliste de «Mendoza».';
    await flushPromises();
    expect(vista.text()).toContain('Saliste de «Mendoza».');
    vista.unmount();
    expect(useViajeStore().avisoLista).toBe('');
  });

  it('sin viajes invita a crear el primero y, al crearlo, abre el viaje nuevo', async () => {
    const vista = await montar([]);
    expect(vista.text()).toContain('Todavía no participás de ningún viaje.');
    await vista
      .findAll('button')
      .find((b) => b.text() === 'Crear mi primer grupo')!
      .trigger('click');
    const dialogo = vista.findComponent(DialogoNuevoViaje);
    expect(dialogo.exists()).toBe(true);
    dialogo.vm.$emit('creado', 'v9');
    await flushPromises();
    expect(push).toHaveBeenCalledWith('/viajes/v9');
    expect(vista.findComponent(DialogoNuevoViaje).exists()).toBe(false);
  });
});
