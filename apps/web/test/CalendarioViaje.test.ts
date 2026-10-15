import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import CalendarioViaje from '../src/componentes/itinerario/CalendarioViaje.vue';

function montar(props: Partial<InstanceType<typeof CalendarioViaje>['$props']> = {}) {
  return mount(CalendarioViaje, {
    props: {
      inicio: '2026-12-10',
      fin: '2026-12-16',
      seleccionado: '2026-12-11',
      diasConActividad: ['2026-12-12'],
      hoy: '2026-10-14',
      ...props,
    },
    attachTo: document.body,
  });
}
const dia = (vista: ReturnType<typeof montar>, fecha: string) =>
  vista.find(`[data-fecha="${fecha}"]`);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('CalendarioViaje', () => {
  it('muestra el mes con solo los días del viaje elegibles, de lunes a domingo', () => {
    const vista = montar();
    expect(vista.find('.calendario__mes').text()).toBe('diciembre 2026');
    // El 1 de diciembre de 2026 es martes: un hueco antes, para el lunes.
    const celdas = vista.findAll('.calendario__dias > *');
    expect(celdas[0]!.text()).toBe('');
    expect(celdas[1]!.text()).toBe('1');
    expect(vista.findAll('button.calendario__dia')).toHaveLength(7);
    expect(vista.findAll('.calendario__dia--fuera')).toHaveLength(31 - 7);
    // Un viaje de un solo mes no muestra flechas.
    expect(vista.find('.calendario__flecha').exists()).toBe(false);
  });

  it('marca el elegido, los días con actividades y hoy, también para lectores de pantalla', () => {
    const vista = montar({ hoy: '2026-12-12' });
    expect(dia(vista, '2026-12-11').attributes('aria-pressed')).toBe('true');
    expect(dia(vista, '2026-12-10').attributes('aria-pressed')).toBe('false');
    const doce = dia(vista, '2026-12-12');
    expect(doce.classes()).toEqual(
      expect.arrayContaining(['calendario__dia--hoy', 'calendario__dia--con-actividad']),
    );
    expect(doce.attributes('aria-label')).toBe('sábado 12 dic, hoy, con actividades');
    // Solo el elegido entra en el orden de Tab.
    expect(dia(vista, '2026-12-11').attributes('tabindex')).toBe('0');
    expect(doce.attributes('tabindex')).toBe('-1');
  });

  it('al tocar un día avisa cuál se eligió', async () => {
    const vista = montar();
    await dia(vista, '2026-12-14').trigger('click');
    expect(vista.emitted('elegir')).toEqual([['2026-12-14']]);
  });

  it('con las flechas mueve el foco dentro del viaje, sin salirse de sus días', async () => {
    const vista = montar();
    await dia(vista, '2026-12-11').trigger('keydown', { key: 'ArrowRight' });
    expect(document.activeElement).toBe(dia(vista, '2026-12-12').element);
    await dia(vista, '2026-12-12').trigger('keydown', { key: 'ArrowDown' });
    // El 19 queda fuera del viaje: el foco no se mueve.
    expect(document.activeElement).toBe(dia(vista, '2026-12-12').element);
    await dia(vista, '2026-12-12').trigger('keydown', { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(dia(vista, '2026-12-11').element);
  });

  it('un viaje de dos meses tiene flechas y cambia de mes al moverse con el teclado', async () => {
    const vista = montar({ inicio: '2026-12-28', fin: '2027-01-05', seleccionado: '2026-12-31' });
    const [anterior, siguiente] = vista.findAll('.calendario__flecha');
    expect(anterior!.attributes('disabled')).toBeDefined();
    await siguiente!.trigger('click');
    expect(vista.find('.calendario__mes').text()).toBe('enero 2027');
    expect(vista.findAll('button.calendario__dia')).toHaveLength(5);
    await anterior!.trigger('click');
    expect(vista.find('.calendario__mes').text()).toBe('diciembre 2026');

    await dia(vista, '2026-12-31').trigger('keydown', { key: 'ArrowRight' });
    expect(vista.find('.calendario__mes').text()).toBe('enero 2027');
    expect(document.activeElement).toBe(dia(vista, '2027-01-01').element);
  });

  it('cuando cambia el día elegido desde afuera, muestra su mes', async () => {
    const vista = montar({ inicio: '2026-12-28', fin: '2027-01-05', seleccionado: '2026-12-31' });
    await vista.setProps({ seleccionado: '2027-01-03' });
    expect(vista.find('.calendario__mes').text()).toBe('enero 2027');
  });
});
