import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { crearRouter } from './router';
import { CLIENTE_AUTH, ClienteAuthHttp } from './clientes/auth';
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
app.use(createPinia());
app.use(crearRouter());
app.mount('#app');
