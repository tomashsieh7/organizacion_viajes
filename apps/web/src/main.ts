import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { crearRouter } from './router';
import { CLIENTE_AUTH, ClienteAuthHttp } from './clientes/auth';
import { CLIENTE_VIAJES, ClienteViajesHttp } from './clientes/viajes';

// Punto de composición del frontend: acá se eligen las implementaciones de los clientes de API (D14).
const app = createApp(App);
app.provide(CLIENTE_AUTH, new ClienteAuthHttp());
app.provide(CLIENTE_VIAJES, new ClienteViajesHttp());
app.use(createPinia());
app.use(crearRouter());
app.mount('#app');
