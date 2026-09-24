import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import IngresoVista from '../src/vistas/IngresoVista.vue';
import {
  clienteAuthFalso,
  clienteViajesFalso,
  errorDeApi,
  montaje,
} from './soporte/clientesFalsos';

const push = vi.fn();
vi.mock('vue-router', () => ({ useRouter: () => ({ push }), useRoute: () => ({ query: {} }) }));

describe('IngresoVista', () => {
  it('valida el formulario antes de llamar a la API', async () => {
    const ingresar = vi.fn();
    const vista = mount(
      IngresoVista,
      montaje(clienteAuthFalso({ ingresar }), clienteViajesFalso()),
    );
    await vista.find('form').trigger('submit');
    expect(ingresar).not.toHaveBeenCalled();
    expect(vista.text()).toContain('Ingresá un email válido');
  });

  it('muestra el mensaje de la API cuando las credenciales no son válidas', async () => {
    const ingresar = vi
      .fn()
      .mockRejectedValue(
        errorDeApi('CREDENCIALES_INVALIDAS', 'El email o la contraseña no son correctos', 401),
      );
    const vista = mount(
      IngresoVista,
      montaje(clienteAuthFalso({ ingresar }), clienteViajesFalso()),
    );
    await vista.find('#email').setValue('ana@mail.com');
    await vista.find('#password').setValue('mala-clave');
    await vista.find('form').trigger('submit');
    await flushPromises();
    expect(vista.find('[role="alert"]').text()).toBe('El email o la contraseña no son correctos');
    expect(push).not.toHaveBeenCalled();
  });

  it('con credenciales válidas lleva a la lista de viajes', async () => {
    const ingresar = vi.fn().mockResolvedValue({ id: 'ana', nombre: 'Ana', apodo: null });
    const vista = mount(
      IngresoVista,
      montaje(clienteAuthFalso({ ingresar }), clienteViajesFalso()),
    );
    await vista.find('#email').setValue('ana@mail.com');
    await vista.find('#password').setValue('una-clave-segura');
    await vista.find('form').trigger('submit');
    await flushPromises();
    expect(push).toHaveBeenCalledWith('/viajes');
  });
});
