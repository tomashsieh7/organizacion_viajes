import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { crearRouter } from '../../src/router';
import {
  clienteAuthFalso,
  clienteViajesFalso,
  errorDeApi,
  montaje,
} from '../soporte/clientesFalsos';

/** Monta una aplicación mínima con el router real y el cliente de autenticación indicado. */
async function navegar(destino: string, autenticado: boolean) {
  const opciones = montaje(
    clienteAuthFalso(
      autenticado
        ? {}
        : {
            yo: async () => {
              throw errorDeApi('NO_AUTENTICADO', 'Tenés que iniciar sesión', 401);
            },
          },
    ),
    clienteViajesFalso(),
  );
  const router = crearRouter();
  mount(defineComponent({ render: () => h('div') }), {
    global: { ...opciones.global, plugins: [...opciones.global.plugins, router] },
  });
  await router.push(destino);
  return router.currentRoute.value;
}

describe('Guarda de sesión del router', () => {
  it('sin sesión, una ruta privada lleva a ingresar y recuerda adónde volver', async () => {
    const ruta = await navegar('/viajes/v1/gastos', false);
    expect(ruta.path).toBe('/ingresar');
    expect(ruta.query).toEqual({ volver: '/viajes/v1/gastos' });
  });

  it('sin sesión, la lista de viajes lleva a ingresar sin parámetro de vuelta', async () => {
    const ruta = await navegar('/viajes', false);
    expect(ruta.fullPath).toBe('/ingresar');
  });

  it('con sesión, las páginas públicas llevan a la lista de viajes', async () => {
    expect((await navegar('/ingresar', true)).path).toBe('/viajes');
    expect((await navegar('/registrarse', true)).path).toBe('/viajes');
  });

  it('con sesión, las rutas privadas se abren', async () => {
    expect((await navegar('/viajes/v1/gastos', true)).path).toBe('/viajes/v1/gastos');
  });

  it('cada página pone su título en la pestaña', async () => {
    await navegar('/viajes/v1/saldos', true);
    expect(document.title).toBe('Saldos · Organizador de viajes');
    await navegar('/ingresar', false);
    expect(document.title).toBe('Ingresar · Organizador de viajes');
  });
});
