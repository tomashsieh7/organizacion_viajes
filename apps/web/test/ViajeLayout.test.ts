import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { CLIENTE_CHAT } from '../src/clientes/chat';
import { useViajeStore } from '../src/stores/viaje';
import ViajeLayout from '../src/vistas/ViajeLayout.vue';
import {
  clienteAuthFalso,
  clienteChatFalso,
  clienteViajesFalso,
  montaje,
} from './soporte/clientesFalsos';

const push = vi.fn();
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { viajeId: 'v1' } }),
  useRouter: () => ({ push }),
}));

describe('ViajeLayout', () => {
  it('se une al chat del viaje y, si lo quitan del grupo, vuelve a la lista con un aviso', async () => {
    const falso = clienteChatFalso();
    const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
      [CLIENTE_CHAT as symbol]: falso.cliente,
    });
    opciones.global.stubs = { ...opciones.global.stubs, RouterView: true } as never;
    const vista = mount(ViajeLayout, opciones);
    await flushPromises();
    expect(falso.conexion.unirse).toHaveBeenCalledWith('v1');
    expect(vista.text()).toContain('Chat');

    falso
      .servidor()
      .membresiaFinalizada({ viajeId: 'v1', motivo: 'ELIMINADO', conservaAccesoSaldos: true });
    await flushPromises();
    expect(push).toHaveBeenCalledWith('/viajes');
    expect(useViajeStore().aviso).toBe(
      'El Admin te quitó de «Bariloche». Todavía tenés saldos pendientes en ese viaje.',
    );
    expect(falso.conexion.cerrar).toHaveBeenCalled();
  });
});
