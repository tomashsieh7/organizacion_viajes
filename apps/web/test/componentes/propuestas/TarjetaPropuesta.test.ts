import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { EstadoPropuesta, PropuestaVista } from '@viajes/compartido';
import TarjetaPropuesta from '../../../src/componentes/propuestas/TarjetaPropuesta.vue';

const ARS = { codigo: 'ARS', nombre: 'Peso argentino', decimales: 2 };

function propuesta(
  estado: EstadoPropuesta,
  miVoto: PropuestaVista['miVoto'] = null,
): PropuestaVista {
  return {
    id: 'p1',
    tipo: 'ALOJAMIENTO',
    estado,
    descripcion: 'Con desayuno',
    precio: 4_800_000,
    ubicacion: 'Mitre 100',
    latitud: null,
    longitud: null,
    autor: { usuarioId: 'tomas', nombre: 'Tomás' },
    votosAFavor: 2,
    votosEnContra: 1,
    miVoto,
    creadaEn: '2026-09-24T12:00:00Z',
    resueltaEn: null,
  };
}

const montar = (p: PropuestaVista, soyAdmin: boolean) =>
  mount(TarjetaPropuesta, { props: { propuesta: p, soyAdmin, moneda: ARS, titulo: 'Hostel' } });
/** El nombre de cada botón: el de los votos está en `aria-label` («A favor»), lo visible es «Sí 2». */
const nombre = (b: ReturnType<ReturnType<typeof montar>['find']>) =>
  b.attributes('aria-label') ?? b.text();
const textos = (v: ReturnType<typeof montar>) => v.findAll('button').map(nombre);
const boton = (v: ReturnType<typeof montar>, texto: string) =>
  v.findAll('button').find((b) => nombre(b) === texto)!;

describe('TarjetaPropuesta', () => {
  it('muestra conteo, precio formateado y autor', () => {
    const v = montar(propuesta('PENDIENTE'), false);
    expect(v.find('.votos > .solo-lectores').text()).toBe('Votos: 2 a favor y 1 en contra');
    expect(v.findAll('.voto').map((c) => c.text())).toEqual(['Sí2', 'No1']);
    // Cada renglón se llena con su parte de los votos: 2 de 3 y 1 de 3.
    expect(v.findAll('.voto__relleno').map((r) => r.attributes('style'))).toEqual([
      'width: 67%;',
      'width: 33%;',
    ]);
    expect(v.text()).toMatch(/\$\s?48\.000,00/);
    expect(v.text()).toContain('propuesta por Tomás');
  });

  it('RN-X2: un viajero común vota pero no ve acciones de Admin', () => {
    expect(textos(montar(propuesta('PENDIENTE'), false))).toEqual(['A favor', 'En contra']);
  });

  it('RN-R1: el Admin ve confirmar y denegar en pendientes, y solo cancelar en confirmadas', () => {
    expect(textos(montar(propuesta('PENDIENTE'), true))).toEqual([
      'A favor',
      'En contra',
      'Denegar',
      'Confirmar',
    ]);
    expect(textos(montar(propuesta('CONFIRMADA'), true))).toEqual(['Cancelar']);
    expect(textos(montar(propuesta('DENEGADA'), true))).toEqual([]);
    expect(textos(montar(propuesta('CANCELADA'), true))).toEqual([]);
  });

  it('P6: con voto propio marca el elegido, y tocarlo otra vez lo retira', async () => {
    const v = montar(propuesta('PENDIENTE', 'A_FAVOR'), false);
    expect(v.find('[aria-pressed="true"]').attributes('aria-label')).toBe('A favor');
    expect(textos(v)).not.toContain('Retirar voto');
    await boton(v, 'A favor').trigger('click');
    expect(v.emitted('desvotar')).toHaveLength(1);
    expect(v.emitted('votar')).toBeUndefined();
    // Tocar el otro cambia el voto en lugar de retirarlo.
    await boton(v, 'En contra').trigger('click');
    expect(v.emitted('votar')).toEqual([['EN_CONTRA']]);
  });

  it('resuelta, muestra los votos que tuvo pero ya no deja votar', () => {
    const v = montar(propuesta('CONFIRMADA', 'A_FAVOR'), false);
    expect(v.findAll('.voto--cerrada').map((c) => c.text())).toEqual(['Sí2', 'No1']);
    // El voto propio sigue marcado con la tilde.
    expect(v.findAll('.voto__marca svg')).toHaveLength(1);
    expect(textos(v)).toEqual([]);
  });

  it('emite el voto y la resolución elegidos', async () => {
    const v = montar(propuesta('PENDIENTE'), true);
    await boton(v, 'En contra').trigger('click');
    await boton(v, 'Confirmar').trigger('click');
    expect(v.emitted('votar')).toEqual([['EN_CONTRA']]);
    expect(v.emitted('resolver')).toEqual([['confirmar']]);
  });

  it('RN-R1: denegar pide confirmación porque no se puede deshacer, y Volver no hace nada', async () => {
    const v = montar(propuesta('PENDIENTE'), true);
    await boton(v, 'Denegar').trigger('click');
    expect(v.emitted('resolver')).toBeUndefined();
    expect(v.find('[role="dialog"]').text()).toContain('¿Denegar «Hostel»? No se puede deshacer.');
    await boton(v, 'Volver').trigger('click');
    expect(v.find('[role="dialog"]').exists()).toBe(false);
    expect(v.emitted('resolver')).toBeUndefined();
    await boton(v, 'Denegar').trigger('click');
    await boton(v, 'Sí, denegar').trigger('click');
    expect(v.emitted('resolver')).toEqual([['denegar']]);
  });

  it('RN-R1: cancelar una confirmada también pide confirmación', async () => {
    const v = montar(propuesta('CONFIRMADA'), true);
    await boton(v, 'Cancelar').trigger('click');
    expect(v.find('[role="dialog"]').text()).toContain('¿Cancelar «Hostel»? No se puede deshacer.');
    await boton(v, 'Sí, cancelar').trigger('click');
    expect(v.emitted('resolver')).toEqual([['cancelar']]);
  });

  it('muestra los saltos de línea de la descripción', () => {
    const v = montar({ ...propuesta('PENDIENTE'), descripcion: 'Uno\nDos' }, false);
    expect(v.find('.descripcion').text()).toBe('Uno\nDos');
    expect(v.find('.descripcion').classes()).toContain('descripcion');
  });

  it('RN-X8: sin descripción no deja un renglón vacío', () => {
    const v = montar({ ...propuesta('PENDIENTE'), descripcion: '' }, false);
    expect(v.find('.descripcion').exists()).toBe(false);
  });
});
