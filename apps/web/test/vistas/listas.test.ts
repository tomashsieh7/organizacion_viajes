import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { Component } from 'vue';
import { CLIENTE_GASTOS } from '../../src/clientes/gastos';
import { CLIENTE_PROPUESTAS } from '../../src/clientes/propuestas';
import ActividadesVista from '../../src/vistas/actividades/ActividadesVista.vue';
import AlojamientosVista from '../../src/vistas/alojamientos/AlojamientosVista.vue';
import GastosVista from '../../src/vistas/gastos/GastosVista.vue';
import ViajesVista from '../../src/vistas/viajes/ViajesVista.vue';
import {
  abrirViaje,
  clienteAuthFalso,
  clienteGastosFalso,
  clienteViajesFalso,
  errorDeApi,
  montaje,
} from '../soporte/clientesFalsos';

/** Una carga que la prueba resuelve o rechaza cuando quiere. */
function cargaPendiente() {
  let resolver!: (v: never[]) => void;
  let rechazar!: (e: unknown) => void;
  const promesa = new Promise<never[]>((ok, mal) => ((resolver = ok), (rechazar = mal)));
  return { cargar: () => promesa, resolver: () => resolver([]), rechazar };
}

/** Monta la vista con la carga de su lista pendiente. */
async function montar(vista: Component, carga: ReturnType<typeof cargaPendiente>) {
  const opciones = montaje(clienteAuthFalso(), clienteViajesFalso({ listar: carga.cargar }), {
    [CLIENTE_GASTOS as symbol]: clienteGastosFalso({ listar: carga.cargar }),
    [CLIENTE_PROPUESTAS as symbol]: {
      listarAlojamientos: carga.cargar,
      listarActividades: carga.cargar,
    },
  });
  await abrirViaje(opciones);
  const montada = mount(vista, opciones);
  await flushPromises();
  return montada;
}

const LISTAS: [string, Component, string][] = [
  ['ViajesVista', ViajesVista, 'Todavía no participás de ningún viaje.'],
  ['GastosVista', GastosVista, 'Todavía no hay gastos anotados.'],
  ['AlojamientosVista', AlojamientosVista, 'Todavía no hay alojamientos propuestos.'],
  ['ActividadesVista', ActividadesVista, 'Todavía no hay actividades propuestas.'],
];

describe.each(LISTAS)('%s: estado de carga', (_nombre, vista, vacia) => {
  it('muestra "Cargando…" hasta la primera carga y después la lista vacía', async () => {
    const carga = cargaPendiente();
    const montada = await montar(vista, carga);
    expect(montada.text()).toContain('Cargando…');
    expect(montada.text()).not.toContain(vacia);

    carga.resolver();
    await flushPromises();
    expect(montada.text()).not.toContain('Cargando…');
    expect(montada.text()).toContain(vacia);
  });

  it('si la carga falla, muestra el error sin el texto de lista vacía', async () => {
    const carga = cargaPendiente();
    const montada = await montar(vista, carga);
    carga.rechazar(errorDeApi('ERROR_INTERNO', 'Ocurrió un error inesperado', 500));
    await flushPromises();
    expect(montada.text()).toContain('Ocurrió un error inesperado');
    expect(montada.text()).not.toContain(vacia);
    expect(montada.text()).not.toContain('Cargando…');
  });
});
