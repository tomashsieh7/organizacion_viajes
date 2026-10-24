/* eslint-disable vue/one-component-per-file -- Componentes mínimos para probar stores aislados. */
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { CLIENTE_PROPUESTAS, type ClientePropuestas } from '../../src/clientes/propuestas';
import { usePropuestasStore } from '../../src/stores/propuestas';
import { useViajeStore } from '../../src/stores/viajes';
import {
  actividad,
  clienteAuthFalso,
  clientePropuestasFalso,
  clienteViajesFalso,
  montaje,
} from '../soporte/clientesFalsos';

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
    expect(stores.propuestas.planificacion).toBeNull();
    expect(proponerAlojamiento).toHaveBeenCalledWith('v1', datos);
  });
});

it('contador: conserva resumen API hasta cargar ambas listas e ignora respuestas de otra navegación', async () => {
  let terminar!: (lista: never[]) => void;
  let terminarVieja!: (lista: never[]) => void;
  let llamada = 0;
  const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
    [CLIENTE_PROPUESTAS as symbol]: {
      listarAlojamientos: () =>
        new Promise<never[]>((r) => {
          if (++llamada === 1) terminarVieja = r;
          else terminar = r;
        }),
      listarActividades: async () => [],
    },
  });
  let viaje!: ReturnType<typeof useViajeStore>;
  let propuestas!: ReturnType<typeof usePropuestasStore>;
  const vista = mount(
    defineComponent({
      setup() {
        viaje = useViajeStore();
        propuestas = usePropuestasStore();
        return () => h('div');
      },
    }),
    opciones,
  );
  await viaje.abrir('v1');
  // Viaje de un día: cargar vacío incorrectamente lo mostraría listo.
  viaje.actual!.fechaFin = viaje.actual!.fechaInicio;
  const anterior = propuestas.cargarTodo();
  propuestas.limpiar();
  const actual = propuestas.cargarTodo();
  terminarVieja([]);
  await anterior;
  expect(propuestas.planificacion?.nochesSinAlojamiento).toBe(6);
  terminar([]);
  await actual;
  expect(propuestas.planificacion).toEqual({
    nochesSinAlojamiento: 0,
    propuestasPendientes: 0,
    propuestasSinDia: 0,
  });
  viaje.actual!.miAcceso = 'SOLO_SALDOS';
  expect(propuestas.planificacion).toBeNull();
  vista.unmount();
});

it('contador: una lectura anterior a proponer no borra la nueva propuesta pendiente', async () => {
  let tardia!: (lista: never[]) => void;
  const cliente = clientePropuestasFalso({
    proponerActividad: async () => actividad('nueva', 'Kayak'),
  });
  const opciones = montaje(clienteAuthFalso(), clienteViajesFalso(), {
    [CLIENTE_PROPUESTAS as symbol]: cliente,
  });
  let viaje!: ReturnType<typeof useViajeStore>;
  let propuestas!: ReturnType<typeof usePropuestasStore>;
  const vista = mount(
    defineComponent({
      setup() {
        viaje = useViajeStore();
        propuestas = usePropuestasStore();
        return () => h('div');
      },
    }),
    opciones,
  );
  await viaje.abrir('v1');
  await propuestas.cargarTodo();
  cliente.listarActividades = () =>
    new Promise<never[]>((r) => {
      tardia = r;
    });
  const lectura = propuestas.cargarActividades();
  await propuestas.proponerActividad({
    titulo: 'Kayak',
    ubicacion: 'Lago',
    latitud: -41,
    longitud: -71,
    fecha: '2026-12-11',
    horaInicio: '10:00',
    duracionMin: 120,
  });
  tardia([]);
  await lectura;
  expect(propuestas.planificacion?.propuestasPendientes).toBe(1);
  vista.unmount();
});
