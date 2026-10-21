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
const textos = (v: ReturnType<typeof montar>) => v.findAll('button').map((b) => b.text());
const boton = (v: ReturnType<typeof montar>, texto: string) =>
  v.findAll('button').find((b) => b.text() === texto)!;

describe('TarjetaPropuesta', () => {
  it('muestra conteo, precio formateado y autor', () => {
    const v = montar(propuesta('PENDIENTE'), false);
    expect(v.find('.solo-lectores').text()).toBe('Votos: 2 a favor y 1 en contra');
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
      'Confirmar',
      'Denegar',
    ]);
    expect(textos(montar(propuesta('CONFIRMADA'), true))).toEqual(['Cancelar']);
    expect(textos(montar(propuesta('DENEGADA'), true))).toEqual([]);
    expect(textos(montar(propuesta('CANCELADA'), true))).toEqual([]);
  });

  it('P6: con voto propio marca el botón elegido y ofrece retirarlo', async () => {
    const v = montar(propuesta('PENDIENTE', 'A_FAVOR'), false);
    expect(v.find('[aria-pressed="true"]').text()).toBe('A favor');
    await v
      .findAll('button')
      .find((b) => b.text() === 'Retirar voto')!
      .trigger('click');
    expect(v.emitted('desvotar')).toHaveLength(1);
  });

  it('emite el voto y la resolución elegidos', async () => {
    const v = montar(propuesta('PENDIENTE'), true);
    await v
      .findAll('button')
      .find((b) => b.text() === 'En contra')!
      .trigger('click');
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
});
