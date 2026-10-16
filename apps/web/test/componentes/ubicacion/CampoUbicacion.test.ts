import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CampoUbicacion, {
  type ValorUbicacion,
} from '../../../src/componentes/ubicacion/CampoUbicacion.vue';
import { BUSCADOR_UBICACIONES, type BuscadorUbicaciones } from '../../../src/clientes/ubicaciones';

const sinPunto: ValorUbicacion = { ubicacion: '', latitud: null, longitud: null };

function montar(buscar: BuscadorUbicaciones['buscar'], valor = sinPunto) {
  const campo = mount(CampoUbicacion, {
    props: {
      modelValue: valor,
      'onUpdate:modelValue': (v: ValorUbicacion) => campo.setProps({ modelValue: v }),
    },
    global: {
      provide: { [BUSCADOR_UBICACIONES as symbol]: { buscar } },
      // Leaflet no se prueba acá: el mapa se reemplaza por un botón que marca un punto.
      stubs: {
        MapaSelector: {
          emits: ['elegir'],
          template: `<button class="mapa" @click="$emit('elegir', -41.1, -71.3)" />`,
        },
      },
    },
  });
  return campo;
}

const ultimoValor = (campo: ReturnType<typeof montar>) =>
  campo.emitted<[ValorUbicacion]>('update:modelValue')!.at(-1)![0];

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('CampoUbicacion (D8)', () => {
  it('busca recién cuando se deja de escribir y al elegir un resultado completa el punto', async () => {
    const buscar = vi.fn(async () => [
      { nombre: 'Cerro Catedral', latitud: -41.17, longitud: -71.44 },
    ]);
    const campo = montar(buscar);
    await campo.find('#ubicacion').setValue('Cer');
    await campo.find('#ubicacion').setValue('Cerro Cat');
    expect(buscar).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(600);
    await flushPromises();
    expect(buscar).toHaveBeenCalledOnce();
    expect(buscar).toHaveBeenCalledWith('Cerro Cat');

    await campo.find('[role="option"]').trigger('click');
    expect(ultimoValor(campo)).toEqual({
      ubicacion: 'Cerro Catedral',
      latitud: -41.17,
      longitud: -71.44,
    });
    expect(campo.find('[role="listbox"]').exists()).toBe(false);
    expect(campo.text()).toContain('Punto marcado en el mapa.');
  });

  it('si el buscador falla, avisa que se puede marcar en el mapa, y el clic en el mapa marca el punto', async () => {
    const campo = montar(async () => {
      throw new Error('sin conexión');
    });
    await campo.find('#ubicacion').setValue('Refugio Frey');
    await vi.advanceTimersByTimeAsync(600);
    await flushPromises();
    expect(campo.text()).toContain(
      'No se pudo buscar el lugar; podés marcarlo con un clic en el mapa.',
    );

    await campo.find('.mapa').trigger('click');
    expect(ultimoValor(campo)).toEqual({
      ubicacion: 'Refugio Frey',
      latitud: -41.1,
      longitud: -71.3,
    });
  });

  it('indica si el punto en el mapa es opcional u obligatorio', async () => {
    expect(montar(async () => []).text()).toContain('El punto en el mapa es opcional.');
    const obligatorio = mount(CampoUbicacion, {
      props: { modelValue: sinPunto, obligatorioEnMapa: true },
      global: {
        provide: { [BUSCADOR_UBICACIONES as symbol]: { buscar: async () => [] } },
        stubs: { MapaSelector: true },
      },
    });
    expect(obligatorio.text()).toContain('Marcá el punto en el mapa.');
  });
});
