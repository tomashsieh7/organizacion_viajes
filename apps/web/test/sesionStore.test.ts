import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { useSesionStore } from '../src/stores/sesion';
import {
  ANA,
  clienteAuthFalso,
  clienteViajesFalso,
  errorDeApi,
  montaje,
} from './soporte/clientesFalsos';

/** Monta un componente vacío para que el store se cree con los clientes inyectados. */
function storeCon(yo: () => Promise<typeof ANA | null>) {
  let store!: ReturnType<typeof useSesionStore>;
  mount(
    defineComponent({ setup: () => ((store = useSesionStore()), () => h('div')) }),
    montaje(clienteAuthFalso({ yo }), clienteViajesFalso()),
  );
  return store;
}

describe('useSesionStore', () => {
  it('consulta la sesión una sola vez', async () => {
    const yo = vi.fn().mockResolvedValue(ANA);
    const store = storeCon(yo);
    await store.cargar();
    await store.cargar();
    expect(store.autenticado).toBe(true);
    expect(yo).toHaveBeenCalledTimes(1);
  });

  it('si el servidor no responde, sigue sin sesión y reintenta en la próxima navegación', async () => {
    const yo = vi
      .fn()
      .mockRejectedValueOnce(errorDeApi('ERROR_INTERNO', 'caído', 500))
      .mockResolvedValueOnce(ANA);
    const store = storeCon(yo);
    await expect(store.cargar()).resolves.toBeUndefined();
    expect(store.autenticado).toBe(false);
    await store.cargar();
    expect(store.autenticado).toBe(true);
  });
});
