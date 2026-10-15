import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, type Component } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import App from '../src/App.vue';
import { useSesionStore } from '../src/stores/sesion';
import { clienteAuthFalso, clienteViajesFalso, montaje } from './soporte/clientesFalsos';

// Páginas mínimas como objetos de componente, para probar solo lo que hace App.
const pagina = (texto: string): Component => ({ render: () => h('main', [h('h1', texto)]) });
const Rota: Component = {
  setup() {
    throw new Error('falla de prueba');
  },
};

/** Monta App con un router en memoria y páginas mínimas, para probar solo lo que hace App. */
async function montarApp(cerrarSesion = vi.fn(async () => undefined)) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/viajes', component: pagina('Mis grupos'), meta: { titulo: 'Mis grupos de viaje' } },
      { path: '/saldos', component: pagina('Saldos'), meta: { titulo: 'Saldos' } },
      { path: '/ingresar', component: pagina('Ingresar'), meta: { titulo: 'Ingresar' } },
      { path: '/rota', component: Rota },
    ],
  });
  const opciones = montaje(clienteAuthFalso({ cerrarSesion }), clienteViajesFalso());
  await router.push('/viajes');
  const app = mount(App, {
    global: { ...opciones.global, plugins: [...opciones.global.plugins, router] },
    attachTo: document.body,
  });
  await useSesionStore().cargar();
  await flushPromises();
  return { app, router, cerrarSesion };
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('App', () => {
  it('la marca tiene un texto largo para escritorio y uno corto para celular', async () => {
    const { app } = await montarApp();
    expect(app.find('.marca__largo').text()).toBe('Organizador de viajes');
    expect(app.find('.marca__corto').text()).toBe('Viajes');
    // El nombre sigue en la página; en celular lo oculta el CSS.
    expect(app.find('.usuario__nombre').exists()).toBe(true);
  });

  it('WCAG 2.4.1: el enlace para saltar lleva el foco al contenido', async () => {
    const { app } = await montarApp();
    await app.find('a.saltar').trigger('click');
    expect(document.activeElement?.id).toBe('contenido');
  });

  it('dentro de un viaje, saltar al contenido lleva a la sección, después de los menús', async () => {
    const { app } = await montarApp();
    const seccion = document.createElement('div');
    seccion.id = 'seccion';
    seccion.tabIndex = -1;
    document.body.append(seccion);
    await app.find('a.saltar').trigger('click');
    expect(document.activeElement).toBe(seccion);
  });

  it('cierra la sesión y lleva al ingreso', async () => {
    const { app, router, cerrarSesion } = await montarApp();
    expect(app.text()).toContain('Ana');
    await app
      .findAll('button')
      .find((b) => b.text() === 'Cerrar sesión')!
      .trigger('click');
    await flushPromises();
    expect(cerrarSesion).toHaveBeenCalledTimes(1);
    expect(router.currentRoute.value.path).toBe('/ingresar');
  });

  it('anuncia la página nueva a los lectores de pantalla sin mover el foco', async () => {
    const { app, router } = await montarApp();
    const anuncio = app.find('[aria-live="polite"]');
    expect(anuncio.text()).toBe('');
    await router.push('/saldos');
    await flushPromises();
    expect(anuncio.text()).toBe('Saldos');
  });

  it('avisa de un error que ningún componente manejó y lo quita al cambiar de página', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { app, router } = await montarApp();
    await router.push('/rota');
    await flushPromises();
    expect(app.find('[role="alert"]').text()).toContain('Algo salió mal');
    await router.push('/saldos');
    await flushPromises();
    expect(app.find('[role="alert"]').exists()).toBe(false);
  });
});
