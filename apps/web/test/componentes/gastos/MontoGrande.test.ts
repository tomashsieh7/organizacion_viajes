import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import MontoGrande from '../../../src/componentes/gastos/MontoGrande.vue';

function montar(inicial: string) {
  const texto = ref(inicial);
  const Envoltorio = defineComponent(
    () => () =>
      h(MontoGrande, {
        id: 'monto',
        simbolo: '$',
        modelValue: texto.value,
        'onUpdate:modelValue': (v: string) => (texto.value = v),
      }),
  );
  return { w: mount(Envoltorio), texto };
}

const visible = (w: ReturnType<typeof montar>['w']) =>
  w.findAll('.monto-grande__visible > span').map((s) => s.text());

describe('MontoGrande', () => {
  it('vacío muestra un 0 de muestra, en gris', () => {
    const { w } = montar('');
    expect(visible(w)).toEqual(['$', '0', '']);
    expect(w.find('.monto-grande').classes()).toContain('monto-grande--vacio');
  });

  it('separa los miles y pone los centavos aparte, chicos y arriba', async () => {
    const { w } = montar('');
    await w.get('#monto').setValue('12345,6');
    expect(visible(w)).toEqual(['$', '12.345', '6', '']);
    await w.get('#monto').setValue('12.345');
    expect(visible(w)).toEqual(['$', '12.345', '']);
  });

  it('con la coma recién escrita insinúa los dos centavos que faltan', () => {
    const { w } = montar('80,');
    expect(visible(w)).toEqual(['$', '80', '00', '']);
    expect(w.find('.monto-grande__chico--pendiente').exists()).toBe(true);
  });

  it('un texto que no es un número se ve tal cual, para que se note el error', () => {
    const { w } = montar('12a');
    expect(visible(w)).toEqual(['$', '12a', '']);
  });

  it('lo escrito llega al modelo, y con montos largos el número se achica', async () => {
    const { w, texto } = montar('');
    await w.get('#monto').setValue('1234567890123');
    expect(texto.value).toBe('1234567890123');
    expect(w.get('.monto-grande__entero').attributes('style')).toContain('font-size: 2rem');
  });
});
