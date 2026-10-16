import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SelectorDeudores from '../src/componentes/gastos/SelectorDeudores.vue';

const participantes = [
  { usuarioId: 'ana', nombre: 'Ana', apodo: null, rol: 'ADMIN' as const },
  { usuarioId: 'tomas', nombre: 'Tomás', apodo: 'Tomi', rol: 'VIAJERO' as const },
  { usuarioId: 'luis', nombre: 'Luis', apodo: null, rol: 'VIAJERO' as const },
];

function montar() {
  const vista = mount(SelectorDeudores, {
    props: {
      participantes,
      modelValue: [] as string[],
      'onUpdate:modelValue': (v: string[]) => vista.setProps({ modelValue: v }),
    },
  });
  return vista;
}
const marcados = (v: ReturnType<typeof montar>) =>
  v.findAll('input[type="checkbox"]').map((c) => (c.element as HTMLInputElement).checked);

describe('SelectorDeudores (RN-G3, P13)', () => {
  it('arranca sin nadie marcado y con el botón para seleccionar a todos', () => {
    const vista = montar();
    expect(marcados(vista)).toEqual([false, false, false]);
    expect(vista.find('button').text()).toBe('Seleccionar a todos');
  });

  it('el botón alterna entre seleccionar a todos y quitar a todos', async () => {
    const vista = montar();
    await vista.find('button').trigger('click');
    expect(vista.props('modelValue')).toEqual(['ana', 'tomas', 'luis']);
    expect(marcados(vista)).toEqual([true, true, true]);
    expect(vista.find('button').text()).toBe('Quitar a todos');
    await vista.find('button').trigger('click');
    expect(vista.props('modelValue')).toEqual([]);
    expect(vista.find('button').text()).toBe('Seleccionar a todos');
  });

  it('cada casilla elige a una persona y el resultado respeta el orden de la lista', async () => {
    const vista = montar();
    const casillas = vista.findAll('input[type="checkbox"]');
    await casillas[2]!.setValue(true);
    await casillas[0]!.setValue(true);
    expect(vista.props('modelValue')).toEqual(['ana', 'luis']);
    await casillas[1]!.setValue(true);
    expect(vista.find('button').text()).toBe('Quitar a todos');
    await casillas[0]!.setValue(false);
    expect(vista.props('modelValue')).toEqual(['tomas', 'luis']);
  });

  it('cada persona es una fila con su inicial y un contador de cuántos pagan', async () => {
    const vista = montar();
    const filas = vista.findAll('.persona');
    expect(filas.map((f) => f.find('.persona__inicial').text())).toEqual(['A', 'T', 'L']);
    expect(filas[1]!.find('.persona__nombre').text()).toBe('Tomás (Tomi)');
    expect(vista.find('.encabezado__cuenta').text()).toBe('0 de 3');
    await filas[1]!.find('input').setValue(true);
    expect(vista.find('.encabezado__cuenta').text()).toBe('1 de 3');
    expect(vista.findAll('.persona')[1]!.classes()).toContain('elegida');
    expect(vista.find('legend').text()).toBe('¿Quiénes tienen que pagar?');
  });
});
