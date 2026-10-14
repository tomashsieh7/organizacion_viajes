import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, reactive } from 'vue';
import { useValidacion } from '../src/composables/useValidacion';

/** Formulario mínimo con dos campos obligatorios. */
function montar() {
  const datos = reactive({ nombre: '', destino: '' });
  let api!: ReturnType<typeof useValidacion>;
  const vista = mount(
    defineComponent({
      setup() {
        api = useValidacion(
          () =>
            Object.fromEntries(
              Object.entries(datos)
                .filter(([, v]) => v.trim() === '')
                .map(([k]) => [k, `Completá ${k}`]),
            ),
          datos,
        );
        return () =>
          h('form', { onFocusout: api.alSalir }, [
            h('input', { id: 'nombre', name: 'nombre', ...api.aria('nombre', 'nombre') }),
            h('input', { id: 'destino', name: 'destino' }),
          ]);
      },
    }),
  );
  return { vista, datos, api };
}

describe('useValidacion', () => {
  it('valida solo el campo que se deja, y su error desaparece al corregirlo', async () => {
    const { vista, datos, api } = montar();
    await vista.find('#nombre').trigger('focusout');
    expect(api.errores.value).toEqual({ nombre: 'Completá nombre' });
    expect(vista.find('#nombre').attributes()).toMatchObject({
      'aria-invalid': 'true',
      'aria-describedby': 'nombre-error',
    });

    datos.nombre = 'Bariloche 2026';
    await nextTick();
    expect(api.errores.value).toEqual({});
    expect(vista.find('#nombre').attributes('aria-invalid')).toBeUndefined();
  });

  it('al enviar valida todos los campos', () => {
    const { api } = montar();
    expect(api.validarTodo()).toBe(false);
    expect(Object.keys(api.errores.value)).toEqual(['nombre', 'destino']);
  });
});
