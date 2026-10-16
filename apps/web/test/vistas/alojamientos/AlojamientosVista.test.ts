import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { AlojamientoVista } from '@viajes/compartido';
import { CLIENTE_PROPUESTAS, type ClientePropuestas } from '../../../src/clientes/propuestas';
import AlojamientosVista from '../../../src/vistas/alojamientos/AlojamientosVista.vue';
import {
  abrirViaje,
  clienteAuthFalso,
  clienteViajesFalso,
  detalle,
  errorDeApi,
  montaje,
} from '../../soporte/clientesFalsos';

function alojamiento(
  id: string,
  nombre: string,
  fechaDesde: string,
  fechaHasta: string,
  cambios: Partial<AlojamientoVista> = {},
): AlojamientoVista {
  return {
    id,
    tipo: 'ALOJAMIENTO',
    estado: 'PENDIENTE',
    descripcion: 'desc',
    precio: 4_800_000,
    ubicacion: 'Centro',
    latitud: null,
    longitud: null,
    autor: { usuarioId: 'tomas', nombre: 'Tomás' },
    votosAFavor: 0,
    votosEnContra: 0,
    miVoto: null,
    creadaEn: '2026-09-24T12:00:00.000Z',
    resueltaEn: null,
    alojamiento: { nombre, fechaDesde, fechaHasta },
    ...cambios,
  };
}

async function montar(cliente: Partial<ClientePropuestas>) {
  const opciones = montaje(
    clienteAuthFalso(),
    clienteViajesFalso({ obtener: async () => detalle('ADMIN') }),
    { [CLIENTE_PROPUESTAS as symbol]: cliente },
  );
  await abrirViaje(opciones);
  const vista = mount(AlojamientosVista, opciones);
  await flushPromises();
  return vista;
}

const cabana = alojamiento('a1', 'Cabaña', '2026-12-10', '2026-12-13');
const hostel = alojamiento('a2', 'Hostel', '2026-12-15', '2026-12-16');

describe('AlojamientosVista', () => {
  it('RN-C3: muestra el rango de fechas y las noches de cada estadía', async () => {
    const vista = await montar({ listarAlojamientos: async () => [cabana, hostel] });
    const tarjetas = vista.findAll('.propuesta');
    expect(tarjetas[0]!.text()).toContain('10 al 13 dic 2026 · 3 noches');
    expect(tarjetas[1]!.text()).toContain('15 al 16 dic 2026 · 1 noche');
  });

  it('vota y actualiza la tarjeta con la respuesta', async () => {
    const votar = vi.fn(async () => ({ ...cabana, votosAFavor: 1, miVoto: 'A_FAVOR' as const }));
    const vista = await montar({ listarAlojamientos: async () => [cabana], votar });
    await vista
      .findAll('button')
      .find((b) => b.text().includes('A favor'))!
      .trigger('click');
    await flushPromises();
    expect(votar).toHaveBeenCalledWith('v1', 'a1', 'A_FAVOR');
    expect(vista.find('[aria-pressed="true"]').text()).toContain('A favor');
  });

  it('muestra el error de la API al resolver', async () => {
    const resolver = vi.fn(async () => {
      throw errorDeApi('PROPUESTA_YA_RESUELTA', 'La propuesta ya está resuelta', 422);
    });
    const vista = await montar({ listarAlojamientos: async () => [cabana], resolver });
    await vista
      .findAll('button')
      .find((b) => b.text() === 'Denegar')!
      .trigger('click');
    await flushPromises();
    expect(resolver).toHaveBeenCalledWith('v1', 'a1', 'denegar');
    expect(vista.find('[role="alert"]').text()).toContain('La propuesta ya está resuelta');
  });

  it('filtra por estado y, sin resultados, sugiere mostrar todos', async () => {
    const listarAlojamientos = vi.fn(async (_viajeId: string, estado?: string) =>
      estado ? [] : [cabana],
    );
    const vista = await montar({ listarAlojamientos });
    await vista.find('#filtro-estado').setValue('CONFIRMADA');
    await flushPromises();
    expect(listarAlojamientos).toHaveBeenLastCalledWith('v1', 'CONFIRMADA');
    expect(vista.text()).toContain('No hay alojamientos con ese estado.');
  });
});
