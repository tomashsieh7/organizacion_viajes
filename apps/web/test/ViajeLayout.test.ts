import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { viajeId: 'v1' }, path: '/viajes/v1/chat' }),
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

beforeEach(() => {
  push.mockReset();
  replace.mockReset();
});

describe('ViajeLayout', () => {
  it('se une al chat del viaje y, si lo quitan del grupo, vuelve a la lista con un aviso', async () => {
    const { falso, vista } = montar();
    await flushPromises();
    expect(falso.conexion.unirse).toHaveBeenCalledWith('v1');
    expect(vista.findAll('nav a').map((a) => a.text())).toContain('Gastos');

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
    expect(vista.findAll('nav a').map((a) => a.text())).toEqual(['Saldos']);
    expect(replace).toHaveBeenCalledWith('/viajes/v1/saldos');
    expect(falso.conexion.unirse).not.toHaveBeenCalled();
  });
});
