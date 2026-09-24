import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { CLIENTE_PROPUESTAS, type ClientePropuestas } from '../src/clientes/propuestas';
import { usePropuestasStore } from '../src/stores/propuestas';
import { useViajeStore } from '../src/stores/viaje';
import { clienteAuthFalso, clienteViajesFalso, montaje } from './soporte/clientesFalsos';

describe('usePropuestasStore', () => {
  it('propone en el viaje abierto aunque no se haya cargado la lista antes', async () => {
    const proponerAlojamiento = vi.fn().mockResolvedValue({ id: 'p1' });
    const cliente = { proponerAlojamiento } as unknown as ClientePropuestas;
    const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
      [CLIENTE_PROPUESTAS as symbol]: cliente,
    });
    let stores!: {
      viaje: ReturnType<typeof useViajeStore>;
      propuestas: ReturnType<typeof usePropuestasStore>;
    };
    mount(
      defineComponent({
        setup: () => (
          (stores = { viaje: useViajeStore(), propuestas: usePropuestasStore() }),
          () => h('div')
        ),
      }),
      opciones,
    );
    await stores.viaje.abrir('v1');
    const datos = {
      nombre: 'H',
      descripcion: 'd',
      ubicacion: 'u',
      fechaDesde: '2026-12-10',
      fechaHasta: '2026-12-11',
    };
    await stores.propuestas.proponerAlojamiento(datos);
    expect(proponerAlojamiento).toHaveBeenCalledWith('v1', datos);
  });
});
