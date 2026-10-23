import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import type { EstadoPropuesta } from '@viajes/compartido';
import FiltroEstados from '../../../src/componentes/propuestas/FiltroEstados.vue';

const propuestas = [
  { estado: 'PENDIENTE' as const },
  { estado: 'PENDIENTE' as const },
  { estado: 'CONFIRMADA' as const },
  { estado: 'CANCELADA' as const },
];

/** «Pendientes 2»: el nombre y la cantidad de un botón del filtro. */
const etiqueta = (b: { find: (s: string) => { text: () => string } }) =>
  `${b.find('.filtro__nombre').text()} ${b.find('.filtro__cantidad').text()}`;

/** Monta el filtro con su modelo, como lo usan las vistas. */
function montar(inicial: EstadoPropuesta[] = [], femenino = false) {
  const estados = ref<EstadoPropuesta[]>(inicial);
  const Envoltorio = defineComponent(
    () => () =>
      h(FiltroEstados, {
        propuestas,
        femenino,
        modelValue: estados.value,
        'onUpdate:modelValue': (v: EstadoPropuesta[]) => (estados.value = v),
      }),
  );
  const w = mount(Envoltorio);
  const boton = (nombre: string) =>
    w.findAll('button').find((b) => b.find('.filtro__nombre').text() === nombre)!;
  const prendidos = () => w.findAll('[aria-pressed="true"]').map(etiqueta);
  const mostrando = () => w.get('.filtro__mostrando').text();
  return { w, estados, boton, prendidos, mostrando };
}

describe('FiltroEstados', () => {
  it('concuerda con «actividades» y cuenta las de cada estado', () => {
    const { w } = montar([], true);
    expect(w.findAll('button').map(etiqueta)).toEqual([
      'Todas 4',
      'Pendientes 2',
      'Confirmadas 1',
      'Denegadas 0',
      'Canceladas 1',
    ]);
  });

  it('sin ningún estado prendido se ven todos', () => {
    const { prendidos, mostrando } = montar();
    expect(prendidos()).toEqual(['Todos 4']);
    expect(mostrando()).toBe('Mostrando todos');
  });

  it('se pueden prender varios estados a la vez, y se leen en el orden de los botones', async () => {
    const { boton, estados, prendidos, mostrando } = montar();
    await boton('Cancelados').trigger('click');
    await boton('Pendientes').trigger('click');
    expect(estados.value).toEqual(['PENDIENTE', 'CANCELADA']);
    expect(prendidos()).toEqual(['Pendientes 2', 'Cancelados 1']);
    expect(mostrando()).toBe('Mostrando pendientes y cancelados');
    await boton('Confirmados').trigger('click');
    expect(mostrando()).toBe('Mostrando pendientes, confirmados y cancelados');
  });

  it('tocar uno prendido lo apaga, y al apagar el último se vuelven a ver todos', async () => {
    const { boton, estados, prendidos } = montar(['PENDIENTE', 'CONFIRMADA']);
    await boton('Pendientes').trigger('click');
    expect(estados.value).toEqual(['CONFIRMADA']);
    await boton('Confirmados').trigger('click');
    expect(estados.value).toEqual([]);
    expect(prendidos()).toEqual(['Todos 4']);
  });

  it('«Todos» apaga los estados prendidos', async () => {
    const { boton, estados } = montar(['PENDIENTE', 'DENEGADA']);
    await boton('Todos').trigger('click');
    expect(estados.value).toEqual([]);
  });
});
