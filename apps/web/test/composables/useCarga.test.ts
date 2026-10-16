import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import AvisoMensaje from '../../src/componentes/base/AvisoMensaje.vue';
import { useCarga } from '../../src/composables/useCarga';
import { errorDeApi } from '../soporte/clientesFalsos';

describe('useCarga', () => {
  it('marca la carga como terminada y sin error cuando sale bien', async () => {
    const { cargado, error, cargar, reintentar } = useCarga(async () => undefined);
    expect(cargado.value).toBe(false);
    await cargar();
    expect([cargado.value, error.value, reintentar.value]).toEqual([true, '', undefined]);
  });

  it('ofrece reintentar si falló la conexión o el servidor, y la segunda vez puede salir bien', async () => {
    const cargarDatos = vi
      .fn()
      .mockRejectedValueOnce(errorDeApi('SIN_CONEXION', 'No se pudo contactar al servidor', 0))
      .mockResolvedValueOnce(undefined);
    const { cargado, error, cargar, reintentar } = useCarga(cargarDatos);
    await cargar();
    expect([cargado.value, error.value]).toEqual([true, 'No se pudo contactar al servidor']);
    await reintentar.value!();
    expect([cargado.value, error.value, reintentar.value]).toEqual([true, '', undefined]);
    expect(cargarDatos).toHaveBeenCalledTimes(2);
  });

  it('no ofrece reintentar ante un rechazo de la API, porque daría lo mismo', async () => {
    for (const [e, reintentable] of [
      [errorDeApi('NO_PARTICIPANTE', 'No participás de este viaje', 403), false],
      [errorDeApi('ERROR_INTERNO', 'Ocurrió un error inesperado', 500), true],
      [new TypeError('Failed to fetch'), true],
    ] as const) {
      const { cargar, reintentar } = useCarga(() => Promise.reject(e));
      await cargar();
      expect(reintentar.value !== undefined).toBe(reintentable);
    }
  });
});

describe('AvisoMensaje', () => {
  it('muestra "Reintentar" solo si recibe qué reintentar, y lo llama al tocarlo', async () => {
    expect(
      mount(AvisoMensaje, { slots: { default: 'Falló' } })
        .find('button')
        .exists(),
    ).toBe(false);
    const reintentar = vi.fn();
    const aviso = mount(AvisoMensaje, {
      props: { tipo: 'error', reintentar },
      slots: { default: 'Falló' },
    });
    await aviso.get('button').trigger('click');
    expect(aviso.get('button').text()).toBe('Reintentar');
    expect(reintentar).toHaveBeenCalledOnce();
  });
});
