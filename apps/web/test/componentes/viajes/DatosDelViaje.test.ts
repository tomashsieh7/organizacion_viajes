import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { AlojamientoVista, RespuestaDatosViaje } from '@viajes/compartido';
import { CLIENTE_PROPUESTAS, type ClientePropuestas } from '../../../src/clientes/propuestas';
import { ErrorDeApi } from '../../../src/clientes/http';
import DatosDelViaje from '../../../src/componentes/viajes/DatosDelViaje.vue';
import { useViajeStore } from '../../../src/stores/viajes';
import {
  abrirViaje,
  actividad,
  clienteAuthFalso,
  clienteViajesFalso,
  detalle,
  montaje,
} from '../../soporte/clientesFalsos';

const alojamiento = (
  id: string,
  nombre: string,
  fechaDesde: string,
  fechaHasta: string,
  estado: AlojamientoVista['estado'] = 'PENDIENTE',
): AlojamientoVista => ({
  ...actividad(id, nombre, { estado }),
  tipo: 'ALOJAMIENTO',
  alojamiento: { nombre, fechaDesde, fechaHasta },
});

// Jueves 10 a miércoles 16 de diciembre.
const PROPUESTAS = {
  alojamientos: [
    alojamiento('h1', 'Hostel Patagonia', '2026-12-10', '2026-12-13'),
    alojamiento('h2', 'Cabaña denegada', '2026-12-14', '2026-12-16', 'DENEGADA'),
  ],
  actividades: [
    actividad('a1', 'Kayak', { fecha: '2026-12-11', estado: 'CONFIRMADA' }),
    actividad('a2', 'Cena', { fecha: '2026-12-15' }),
    actividad('a3', 'Rafting cancelado', { fecha: '2026-12-16', estado: 'CANCELADA' }),
  ],
};

async function montar(
  rol: 'ADMIN' | 'VIAJERO' = 'ADMIN',
  modificarDatos = vi.fn(
    async (_id: string, datos: { nombre: string }): Promise<RespuestaDatosViaje> => ({
      viaje: { ...detalle('ADMIN'), ...datos },
      reacomodo: { semanas: 1, movidas: 3 },
    }),
  ),
  listar: Partial<ClientePropuestas> = {},
) {
  const propuestas = {
    listarAlojamientos: vi.fn(async () => PROPUESTAS.alojamientos),
    listarActividades: vi.fn(async () => PROPUESTAS.actividades),
    ...listar,
  } as unknown as ClientePropuestas;
  const opciones = montaje(
    clienteAuthFalso(),
    clienteViajesFalso({ obtener: async () => detalle(rol), modificarDatos }),
    { [CLIENTE_PROPUESTAS as symbol]: propuestas },
  );
  await abrirViaje(opciones);
  const vista = mount(DatosDelViaje, { ...opciones, attachTo: document.body });
  await flushPromises();
  return { vista, modificarDatos, propuestas };
}

async function editar(vista: Awaited<ReturnType<typeof montar>>['vista']) {
  await vista.find('button').trigger('click');
  await flushPromises();
}
const fechas = async (
  vista: Awaited<ReturnType<typeof montar>>['vista'],
  desde: string,
  hasta: string,
) => {
  await vista.find('#datos-inicio').setValue(desde);
  await vista.find('#datos-fin').setValue(hasta);
};
const guardar = (vista: Awaited<ReturnType<typeof montar>>['vista']) =>
  vista.findAll('button').find((b) => b.text() === 'Guardar')!;

describe('DatosDelViaje (CU27)', () => {
  it('RN-V1: muestra los datos a todos y solo el Admin ve «Editar»', async () => {
    const admin = await montar('ADMIN');
    expect(admin.vista.text()).toContain('Bariloche');
    expect(admin.vista.text()).toContain('10 al 16 dic 2026');
    expect(admin.vista.text()).toContain('Peso argentino');
    expect(admin.vista.find('button').text()).toBe('Editar');
    admin.vista.unmount();
    const viajero = await montar('VIAJERO');
    expect(viajero.vista.find('button').exists()).toBe(false);
    viajero.vista.unmount();
  });

  it('RN-V2: corrido una semana avisa antes de guardar, y alargado no avisa nada', async () => {
    const { vista } = await montar();
    await editar(vista);
    await fechas(vista, '2026-12-17', '2026-12-23');
    expect(vista.text()).toContain('Al guardar, las propuestas se corren 1 semana para adelante.');
    await fechas(vista, '2026-11-26', '2026-12-02');
    expect(vista.text()).toContain('se corren 2 semanas para atrás.');
    await fechas(vista, '2026-12-08', '2026-12-20');
    expect(vista.text()).not.toContain('Al guardar');
    expect(guardar(vista).attributes('disabled')).toBeUndefined();
    vista.unmount();
  });

  it('RN-V3: si algo pendiente o confirmado queda afuera, lo lista y no deja guardar; lo denegado y cancelado no cuenta', async () => {
    const { vista, modificarDatos } = await montar();
    await editar(vista);
    await fechas(vista, '2026-12-12', '2026-12-14');
    expect(vista.text()).toContain('Quedan afuera 3 propuestas.');
    const filas = vista.findAll('.afuera__fila').map((f) => f.text());
    expect(filas).toEqual([
      'Hostel Patagonia10 al 13 dic 2026',
      'Kayakviernes 11 dic',
      'Cenamartes 15 dic',
    ]);
    expect(guardar(vista).attributes('disabled')).toBeDefined();
    await vista.find('form').trigger('submit');
    expect(modificarDatos).not.toHaveBeenCalled();
    vista.unmount();
  });

  it('CU27: guarda, cierra el diálogo, muestra el resultado y vuelve a leer las propuestas movidas', async () => {
    const { vista, modificarDatos, propuestas } = await montar();
    await editar(vista);
    await vista.find('#datos-nombre').setValue('Sur');
    await fechas(vista, '2026-12-17', '2026-12-23');
    await vista.find('form').trigger('submit');
    await flushPromises();
    expect(modificarDatos).toHaveBeenCalledWith('v1', {
      nombre: 'Sur',
      destino: 'Bariloche',
      fechaInicio: '2026-12-17',
      fechaFin: '2026-12-23',
    });
    expect(vista.find('form').exists()).toBe(false);
    expect(vista.text()).toContain(
      'Se guardaron los datos del viaje. Las propuestas se corrieron 1 semana para adelante.',
    );
    expect(useViajeStore().actual?.nombre).toBe('Sur');
    expect(propuestas.listarActividades).toHaveBeenCalledTimes(2);
    vista.unmount();
  });

  it('RN-V3: si el servidor encuentra propuestas afuera, las lista; al cambiar las fechas se vuelve a calcular', async () => {
    const modificarDatos = vi.fn(async () => {
      throw new ErrorDeApi(409, 'REACOMODO_NECESARIO', 'Quedan afuera', {
        propuestas: [
          {
            id: 'n1',
            tipo: 'ACTIVIDAD',
            titulo: 'Nueva',
            desde: '2026-12-16',
            hasta: '2026-12-16',
          },
        ],
      });
    });
    const { vista } = await montar('ADMIN', modificarDatos);
    await editar(vista);
    await fechas(vista, '2026-12-10', '2026-12-15');
    await vista.find('form').trigger('submit');
    await flushPromises();
    expect(vista.text()).toContain('Quedan afuera 1 propuesta.');
    expect(vista.find('.afuera__fila').text()).toContain('Nueva');
    expect(guardar(vista).attributes('disabled')).toBeDefined();
    await fechas(vista, '2026-12-10', '2026-12-20');
    expect(vista.find('.afuera').exists()).toBe(false);
    vista.unmount();
  });

  it('valida los campos como al crear el viaje y no llama a la API', async () => {
    const { vista, modificarDatos } = await montar();
    await editar(vista);
    await vista.find('#datos-nombre').setValue('   ');
    await fechas(vista, '2026-12-16', '2026-12-10');
    await vista.find('form').trigger('submit');
    expect(vista.text()).toContain('Ingresá un nombre');
    expect(vista.text()).toContain('La fecha de inicio no puede ser posterior a la de fin');
    expect(modificarDatos).not.toHaveBeenCalled();
    vista.unmount();
  });

  it('si no se pudieron leer las propuestas, no anticipa nada y deja decidir al servidor', async () => {
    const { vista, modificarDatos } = await montar('ADMIN', undefined, {
      listarActividades: vi.fn(async () => {
        throw new Error('sin conexión');
      }),
    });
    await editar(vista);
    await fechas(vista, '2026-12-12', '2026-12-13');
    expect(vista.find('.afuera').exists()).toBe(false);
    await vista.find('form').trigger('submit');
    await flushPromises();
    expect(modificarDatos).toHaveBeenCalled();
    vista.unmount();
  });
});
