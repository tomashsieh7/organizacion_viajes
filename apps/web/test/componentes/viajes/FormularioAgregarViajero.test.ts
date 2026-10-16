import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import FormularioAgregarViajero from '../../../src/componentes/viajes/FormularioAgregarViajero.vue';
import {
  TOMAS,
  abrirViaje,
  clienteAuthFalso,
  clienteViajesFalso,
  errorDeApi,
  montaje,
} from '../../soporte/clientesFalsos';

async function montar(agregarViajero = vi.fn(async () => TOMAS)) {
  const opciones = montaje(clienteAuthFalso(), clienteViajesFalso({ agregarViajero }));
  await abrirViaje(opciones);
  return { formulario: mount(FormularioAgregarViajero, opciones), agregarViajero };
}

async function agregar(
  formulario: Awaited<ReturnType<typeof montar>>['formulario'],
  email: string,
) {
  await formulario.find('#agregar-email').setValue(email);
  await formulario.find('form').trigger('submit');
  await flushPromises();
}

describe('FormularioAgregarViajero (CU02)', () => {
  it('valida el email antes de llamar a la API', async () => {
    const { formulario, agregarViajero } = await montar();
    await agregar(formulario, 'no-es-un-email');
    expect(agregarViajero).not.toHaveBeenCalled();
    expect(formulario.text()).toContain('Ingresá un email válido');
  });

  it('agrega al viajero, lo confirma y limpia el campo', async () => {
    const { formulario, agregarViajero } = await montar();
    await agregar(formulario, 'tomas@mail.com');
    expect(agregarViajero).toHaveBeenCalledWith('v1', 'tomas@mail.com');
    expect(formulario.text()).toContain('Se agregó a tomas@mail.com');
    expect((formulario.find('#agregar-email').element as HTMLInputElement).value).toBe('');
  });

  it('muestra el motivo si la API no lo agrega', async () => {
    const { formulario } = await montar(
      vi.fn(async () => {
        throw errorDeApi(
          'USUARIO_NO_REGISTRADO',
          'No hay ningún usuario registrado con ese email',
          404,
        );
      }),
    );
    await agregar(formulario, 'nadie@mail.com');
    expect(formulario.text()).toContain('No hay ningún usuario registrado con ese email');
  });
});
