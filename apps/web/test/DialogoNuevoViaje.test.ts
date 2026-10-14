import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import DialogoNuevoViaje from '../src/componentes/viajes/DialogoNuevoViaje.vue';
import { ErrorDeApi } from '../src/clientes/http';
import { clienteAuthFalso, clienteViajesFalso, detalle, montaje } from './soporte/clientesFalsos';

const ARS = { codigo: 'ARS', nombre: 'Peso argentino', decimales: 2 };

function montar(crear = vi.fn(async () => detalle('ADMIN'))) {
  const opciones = montaje(
    clienteAuthFalso(),
    clienteViajesFalso({ monedas: async () => [ARS], crear }),
  );
  return { dialogo: mount(DialogoNuevoViaje, opciones), crear };
}

async function completar(dialogo: ReturnType<typeof montar>['dialogo']) {
  await dialogo.find('#viaje-nombre').setValue('Bariloche 2026');
  await dialogo.find('#viaje-destino').setValue('Bariloche');
  await dialogo.find('#viaje-inicio').setValue('2026-12-10');
  await dialogo.find('#viaje-fin').setValue('2026-12-16');
}

describe('DialogoNuevoViaje (CU01)', () => {
  it('valida antes de llamar a la API', async () => {
    const { dialogo, crear } = montar();
    await flushPromises();
    await dialogo.find('form').trigger('submit');
    expect(crear).not.toHaveBeenCalled();
    expect(dialogo.text()).toContain('Ingresá un nombre');
  });

  it('crea el viaje y avisa su id', async () => {
    const { dialogo, crear } = montar();
    await flushPromises();
    await completar(dialogo);
    await dialogo.find('form').trigger('submit');
    await flushPromises();
    expect(crear).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Bariloche 2026', monedaCodigo: 'ARS' }),
    );
    expect(dialogo.emitted('creado')).toEqual([['v1']]);
  });

  it('muestra junto a cada campo los errores de validación de la API', async () => {
    const { dialogo } = montar(
      vi.fn(async () => {
        throw new ErrorDeApi(400, 'VALIDACION', 'Datos inválidos', [
          { campo: 'fechaFin', mensaje: 'La fecha de fin no puede ser anterior al inicio' },
        ]);
      }),
    );
    await flushPromises();
    await completar(dialogo);
    await dialogo.find('form').trigger('submit');
    await flushPromises();
    expect(dialogo.text()).toContain('La fecha de fin no puede ser anterior al inicio');
    expect(dialogo.emitted('creado')).toBeUndefined();
  });
});
