import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegistroVista from '../src/vistas/RegistroVista.vue';
import { ErrorDeApi } from '../src/clientes/http';
import { clienteAuthFalso, clienteViajesFalso, montaje } from './soporte/clientesFalsos';

const push = vi.fn();
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }));

function montar(registrarse = vi.fn(async () => ({ id: 'ana', nombre: 'Ana', apodo: null }))) {
  const vista = mount(
    RegistroVista,
    montaje(clienteAuthFalso({ registrarse }), clienteViajesFalso()),
  );
  return { vista, registrarse };
}

async function completar(vista: ReturnType<typeof montar>['vista'], password: string) {
  await vista.find('#nombre').setValue('Ana');
  await vista.find('#email').setValue('ana@mail.com');
  await vista.find('#password').setValue(password);
  await vista.find('form').trigger('submit');
  await flushPromises();
}

beforeEach(() => push.mockReset());

describe('RegistroVista', () => {
  it('valida el formulario antes de llamar a la API', async () => {
    const { vista, registrarse } = montar();
    await vista.find('form').trigger('submit');
    expect(registrarse).not.toHaveBeenCalled();
    expect(vista.text()).toContain('Ingresá tu nombre');
  });

  it('RN-S1: rechaza una contraseña común sin llamar a la API', async () => {
    const { vista, registrarse } = montar();
    await completar(vista, 'password123');
    expect(registrarse).not.toHaveBeenCalled();
    expect(vista.text()).toContain('Esa contraseña es demasiado común; elegí otra');
  });

  it('con datos válidos crea la cuenta y lleva a la lista de viajes', async () => {
    const { vista, registrarse } = montar();
    await completar(vista, 'una-clave-segura');
    expect(registrarse).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Ana', email: 'ana@mail.com' }),
    );
    expect(push).toHaveBeenCalledWith('/viajes');
  });

  it('muestra el error de la API si el email ya está en uso', async () => {
    const { vista } = montar(
      vi.fn(async () => {
        throw new ErrorDeApi(409, 'EMAIL_EN_USO', 'Ya hay una cuenta registrada con ese email');
      }),
    );
    await completar(vista, 'una-clave-segura');
    expect(vista.text()).toContain('Ya hay una cuenta registrada con ese email');
    expect(push).not.toHaveBeenCalled();
  });
});

describe('RegistroVista: accesibilidad', () => {
  it('la ayuda de la contraseña describe al campo, y el error se suma cuando aparece', async () => {
    const { vista } = montar();
    const password = vista.find('#password');
    expect(password.attributes('aria-describedby')).toBe('password-ayuda');
    await password.setValue('corta');
    await password.trigger('focusout');
    expect(password.attributes('aria-describedby')).toBe('password-error password-ayuda');
    expect(password.attributes('aria-invalid')).toBe('true');
  });
});
