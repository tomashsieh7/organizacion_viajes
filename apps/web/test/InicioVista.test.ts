import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import InicioVista from '../src/vistas/InicioVista.vue';
import { CLIENTE_SALUD, type ClienteSalud } from '../src/clientes/salud';

function montar(cliente: ClienteSalud) {
  return mount(InicioVista, { global: { provide: { [CLIENTE_SALUD as symbol]: cliente } } });
}

describe('F0 — InicioVista', () => {
  it('muestra que el servidor está disponible cuando la API responde', async () => {
    const vista = montar({ consultar: async () => ({ ok: true }) });
    await flushPromises();
    expect(vista.text()).toContain('Servidor disponible');
  });

  it('avisa cuando no puede contactar al servidor', async () => {
    const vista = montar({
      consultar: async () => {
        throw new Error('sin red');
      },
    });
    await flushPromises();
    expect(vista.text()).toContain('No se pudo contactar al servidor');
  });
});
