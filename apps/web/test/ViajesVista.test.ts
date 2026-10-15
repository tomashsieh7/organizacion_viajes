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
  mensajesSinLeer: 0,
  ultimaNovedad: null,
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
  it('cada fila muestra destino, fechas, rol y la cuenta regresiva', async () => {
    const vista = await montar([
      viaje('v1', { miRol: 'ADMIN' }),
      viaje('v2', { nombre: 'Mendoza', miAcceso: 'SOLO_SALDOS' }),
    ]);
    const filas = vista.findAll('.grupo');
    expect(filas[0]!.find('.inicial-persona').text()).toBe('B');
    expect(filas[0]!.find('.grupo__detalle').text()).toBe(
      'Bariloche · 10 al 16 dic 2026 · Faltan 57 días',
    );
    expect(filas[0]!.text()).toContain('Admin');
    expect(filas[0]!.find('.grupo__novedad').text()).toBe('Sin novedades todavía');
    expect(filas[0]!.find('.grupo__sin-leer').exists()).toBe(false);
    expect(filas[1]!.text()).toContain('Solo saldos');
  });

  it('como una lista de chats: última novedad, cuándo fue y mensajes sin leer', async () => {
    const tomas = { id: 'tomas', nombre: 'Tomás', apodo: null };
    const vista = await montar([
      viaje('v1', {
        mensajesSinLeer: 3,
        ultimaNovedad: {
          tipo: 'MENSAJE',
          autor: tomas,
          texto: '¿Salimos a las 9?',
          monto: null,
          contraparte: null,
          en: '2026-10-14T09:05:00',
        },
      }),
      viaje('v2', {
        mensajesSinLeer: 1,
        ultimaNovedad: {
          tipo: 'PAGO',
          autor: tomas,
          texto: '',
          monto: 40_000,
          contraparte: { id: 'ana', nombre: 'Ana', apodo: null },
          en: '2026-10-13T20:00:00',
        },
      }),
    ]);
    const [hoy, ayer] = vista.findAll('.grupo');
    expect(hoy!.find('.grupo__novedad').text()).toBe('Tomás: ¿Salimos a las 9?');
    expect(hoy!.find('time').text()).toBe('09:05');
    expect(hoy!.find('.grupo__sin-leer').text()).toContain('3 mensajes sin leer');
    expect(ayer!.find('.grupo__novedad').text()).toMatch(/^Tomás te pagó \$\s400,00$/);
    expect(ayer!.find('time').text()).toBe('Ayer');
    expect(ayer!.find('.grupo__sin-leer .solo-lectores').text()).toBe('1 mensaje sin leer');
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
