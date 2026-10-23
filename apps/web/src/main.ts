import { createApp } from 'vue';
import { createPinia } from 'pinia';
// Fuentes servidas por la propia app (PLAN 7.1.1): Poppins en los títulos e Inter en el texto.
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import '@fontsource-variable/inter/wght.css';
import App from './App.vue';
import { crearRouter } from './router';
import { CLIENTE_AUTH, ClienteAuthHttp } from './clientes/auth';
import { alPerderSesion } from './clientes/http';
import { useSesionStore } from './stores/sesion';
import { CLIENTE_VIAJES, ClienteViajesHttp } from './clientes/viajes';
import { CLIENTE_PROPUESTAS, ClientePropuestasHttp } from './clientes/propuestas';
import { BUSCADOR_UBICACIONES, BuscadorNominatim } from './clientes/ubicaciones';
import { CLIENTE_ITINERARIO, ClienteItinerarioHttp } from './clientes/itinerario';
import { CLIENTE_CHAT, ClienteChatSocketIO } from './clientes/chat';
import { CLIENTE_GASTOS, ClienteGastosHttp } from './clientes/gastos';

// Punto de composición del frontend: acá se eligen las implementaciones de los clientes de API (D14).
const app = createApp(App);
app.provide(CLIENTE_AUTH, new ClienteAuthHttp());
app.provide(CLIENTE_VIAJES, new ClienteViajesHttp());
app.provide(CLIENTE_PROPUESTAS, new ClientePropuestasHttp());
app.provide(BUSCADOR_UBICACIONES, new BuscadorNominatim());
app.provide(CLIENTE_ITINERARIO, new ClienteItinerarioHttp());
app.provide(CLIENTE_CHAT, new ClienteChatSocketIO());
app.provide(CLIENTE_GASTOS, new ClienteGastosHttp());
const pinia = createPinia();
const router = crearRouter();
app.use(pinia);
app.use(router);

// Si la sesión vence o se cierra en otra pestaña, se vuelve al ingreso recordando dónde se estaba.
alPerderSesion(() => {
  const sesion = useSesionStore(pinia);
  if (!sesion.perder()) return;
  void router.push({
    path: '/ingresar',
    query: { volver: router.currentRoute.value.fullPath, motivo: 'sesion' },
  });
});
app.mount('#app');
