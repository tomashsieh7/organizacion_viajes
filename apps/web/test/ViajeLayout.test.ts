import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLIENTE_CHAT } from '../src/clientes/chat';
import { useViajeStore } from '../src/stores/viaje';
import ViajeLayout from '../src/vistas/ViajeLayout.vue';
import {
  clienteAuthFalso,
  clienteChatFalso,
  clienteViajesFalso,
  detalle,
  montaje,
} from './soporte/clientesFalsos';

const push = vi.fn();
const replace = vi.fn();
let ruta = '/viajes/v1/chat';
let consulta: Record<string, string> = {};
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { viajeId: 'v1' }, path: ruta, query: consulta }),
  useRouter: () => ({ push, replace }),
}));

function montar(obtener = async () => detalle('VIAJERO')) {
  const falso = clienteChatFalso();
  const opciones = montaje(clienteAuthFalso(), clienteViajesFalso({ obtener }), {
    [CLIENTE_CHAT as symbol]: falso.cliente,
  });
  opciones.global.stubs = { ...opciones.global.stubs, RouterView: true } as never;
  return { falso, vista: mount(ViajeLayout, opciones) };
}

afterEach(() => vi.useRealTimers());

beforeEach(() => {
  ruta = '/viajes/v1/chat';
  consulta = {};
  push.mockReset();
  replace.mockReset();
});

describe('ViajeLayout', () => {
  it('se une al chat del viaje y, si lo quitan del grupo, vuelve a la lista con un aviso', async () => {
    const { falso, vista } = montar();
    await flushPromises();
    expect(falso.conexion.unirse).toHaveBeenCalledWith('v1');
    // Los cinco grupos, con el del chat activo y sin pestañas porque tiene una sola sección.
    expect(vista.findAll('nav.grupos .grupo__nombre').map((a) => a.text())).toEqual([
      'Inicio',
      'Planificar',
      'Itinerario',
      'Chat',
      'Cuentas',
    ]);
    expect(vista.find('nav.grupos [aria-current="page"] .grupo__nombre').text()).toBe('Chat');
    expect(vista.find('nav.subsecciones').exists()).toBe(false);

    falso
      .servidor()
      .membresiaFinalizada({ viajeId: 'v1', motivo: 'ELIMINADO', conservaAccesoSaldos: false });
    await flushPromises();
    expect(push).toHaveBeenCalledWith('/viajes');
    expect(useViajeStore().aviso).toBe('El Admin te quitó de «Bariloche».');
    expect(falso.conexion.cerrar).toHaveBeenCalled();
  });

  it('RN-E6: si le quedan saldos, lo lleva a la sección de saldos con el aviso', async () => {
    let acceso: 'COMPLETO' | 'SOLO_SALDOS' = 'COMPLETO';
    const { falso } = montar(async () => detalle('VIAJERO', 0, acceso));
    await flushPromises();
    acceso = 'SOLO_SALDOS';
    falso
      .servidor()
      .membresiaFinalizada({ viajeId: 'v1', motivo: 'RETIRADO', conservaAccesoSaldos: true });
    await flushPromises();
    expect(push).toHaveBeenCalledWith('/viajes/v1/saldos');
    expect(useViajeStore().aviso).toBe(
      'Saliste de «Bariloche». Podés seguir viendo tus saldos hasta que queden en cero.',
    );
  });

  it('RN-E6: con acceso solo a saldos muestra solo esa sección y no entra al chat', async () => {
    const { falso, vista } = montar(async () => detalle('VIAJERO', 0, 'SOLO_SALDOS'));
    await flushPromises();
    expect(vista.find('nav').exists()).toBe(false);
    expect(replace).toHaveBeenCalledWith('/viajes/v1/saldos');
    expect(falso.conexion.unirse).not.toHaveBeenCalled();
  });

  it('en una subruta marca su grupo y muestra las pestañas de las secciones del grupo', async () => {
    ruta = '/viajes/v1/gastos/nuevo';
    const { vista } = montar();
    await flushPromises();
    expect(vista.find('nav.grupos [aria-current="page"] .grupo__nombre').text()).toBe('Cuentas');
    const pestanas = vista.findAll('nav.subsecciones a');
    expect(pestanas.map((a) => a.text())).toEqual(['Gastos', 'Saldos']);
    expect(pestanas[0]!.attributes('aria-current')).toBe('page');
    expect(pestanas[1]!.attributes('aria-current')).toBeUndefined();
  });

  it('Participantes se abre desde la portada y cuenta como parte de Inicio', async () => {
    ruta = '/viajes/v1/participantes';
    const { vista } = montar();
    await flushPromises();
    const viajeros = vista.find('a.portada__viajeros');
    expect(viajeros.text()).toBe('2 viajeros');
    expect(viajeros.attributes('aria-current')).toBe('page');
    expect(vista.find('nav.grupos [aria-current="page"] .grupo__nombre').text()).toBe('Inicio');
    // Inicio tiene una sola sección: no hay pestañas.
    expect(vista.find('nav.subsecciones').exists()).toBe(false);
  });

  it('con acceso solo a saldos, los viajeros de la portada no son un enlace', async () => {
    ruta = '/viajes/v1/saldos';
    const { vista } = montar(async () => detalle('VIAJERO', 0, 'SOLO_SALDOS'));
    await flushPromises();
    expect(vista.find('a.portada__viajeros').exists()).toBe(false);
    expect(vista.find('span.portada__viajeros').text()).toBe('2 viajeros');
  });

  it('la cuenta regresiva va debajo del nombre y cambia antes, durante y después del viaje', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-14T12:00:00'));
    const antes = montar().vista;
    await flushPromises();
    expect(antes.find('h1 + .chip').text()).toBe('Faltan 57 días');

    vi.setSystemTime(new Date('2026-12-12T12:00:00'));
    const durante = montar().vista;
    await flushPromises();
    expect(durante.find('.chip').text()).toBe('Día 3 de 7');

    vi.setSystemTime(new Date('2026-12-20T12:00:00'));
    const despues = montar().vista;
    await flushPromises();
    expect(despues.find('.chip--despues').text()).toBe('Viaje terminado');
  });

  it('las pestañas del itinerario conservan el día elegido', async () => {
    ruta = '/viajes/v1/mapa';
    consulta = { dia: '2026-12-15' };
    const opciones = montar();
    await flushPromises();
    const pestanas = opciones.vista.findAll('nav.subsecciones a');
    expect(pestanas.map((a) => a.text())).toEqual(['Cronograma', 'Mapa']);
    // El stub de RouterLink deja `to` como atributo del enlace.
    expect(pestanas.map((a) => a.attributes('to'))).toEqual([
      '/viajes/v1/cronograma?dia=2026-12-15',
      '/viajes/v1/mapa?dia=2026-12-15',
    ]);
  });
});
