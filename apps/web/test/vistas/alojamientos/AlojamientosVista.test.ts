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

/** «Pendientes 2»: el nombre y la cantidad de un botón del filtro. */
const etiqueta = (b: { find: (s: string) => { text: () => string } }) =>
  `${b.find('.filtro__nombre').text()} ${b.find('.filtro__cantidad').text()}`;

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
      .find((b) => b.attributes('aria-label') === 'A favor')!
      .trigger('click');
    await flushPromises();
    expect(votar).toHaveBeenCalledWith('v1', 'a1', 'A_FAVOR');
    expect(vista.find('.voto[aria-pressed="true"]').attributes('aria-label')).toBe('A favor');
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
    await vista
      .findAll('button')
      .find((b) => b.text() === 'Sí, denegar')!
      .trigger('click');
    await flushPromises();
    expect(resolver).toHaveBeenCalledWith('v1', 'a1', 'denegar');
    expect(vista.find('[role="alert"]').text()).toContain('La propuesta ya está resuelta');
  });

  it('si la propuesta ya cambió de estado al votar, avisa y muestra cómo quedó', async () => {
    let estado: AlojamientoVista['estado'] = 'PENDIENTE';
    const listarAlojamientos = vi.fn(async () => [{ ...cabana, estado }]);
    const votar = vi.fn(async () => {
      estado = 'CONFIRMADA'; // el Admin la confirmó mientras la lista estaba abierta
      throw errorDeApi('PROPUESTA_NO_PENDIENTE', 'La propuesta ya fue resuelta', 409);
    });
    const vista = await montar({ listarAlojamientos, votar });
    expect(vista.find('button[aria-label="A favor"]').exists()).toBe(true);
    await vista
      .findAll('button')
      .find((b) => b.attributes('aria-label') === 'A favor')!
      .trigger('click');
    await flushPromises();
    expect(vista.find('[role="alert"]').text()).toContain('La propuesta ya fue resuelta');
    expect(vista.findAll('button').some((b) => b.attributes('aria-label') === 'A favor')).toBe(
      false,
    );
    expect(vista.text()).toContain('Confirmada');
  });

  it('filtra con varios estados a la vez, cada uno con su cantidad, y sin resultados lo dice', async () => {
    const confirmada = { ...cabana, id: 'a2', estado: 'CONFIRMADA' as const };
    const listarAlojamientos = vi.fn(async () => [cabana, confirmada]);
    const vista = await montar({ listarAlojamientos });
    const botones = () => vista.findAll('.filtro button');
    const estados = () => vista.findAll('.propuesta').map((p) => p.attributes('data-estado'));
    expect(botones().map(etiqueta)).toEqual([
      'Todos 2',
      'Pendientes 1',
      'Confirmados 1',
      'Denegados 0',
      'Cancelados 0',
    ]);
    expect(botones()[0]!.attributes('aria-pressed')).toBe('true');
    await botones()[2]!.trigger('click');
    expect(estados()).toEqual(['CONFIRMADA']);
    await botones()[1]!.trigger('click');
    expect(estados()).toEqual(['PENDIENTE', 'CONFIRMADA']);
    expect(botones()[0]!.attributes('aria-pressed')).toBe('false');
    await botones()[1]!.trigger('click');
    await botones()[2]!.trigger('click');
    await botones()[3]!.trigger('click');
    expect(vista.text()).toContain('No hay alojamientos con esos estados.');
    // Se filtra en la pantalla: no se vuelve a pedir la lista.
    expect(listarAlojamientos).toHaveBeenCalledTimes(1);
    expect(listarAlojamientos).toHaveBeenCalledWith('v1');
  });
});
