import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { crearRouter } from './router';
import { CLIENTE_SALUD, ClienteSaludHttp } from './clientes/salud';

// Punto de composición del frontend: acá se eligen las implementaciones de los clientes de API.
const app = createApp(App);
app.use(createPinia());
app.use(crearRouter());
app.provide(CLIENTE_SALUD, new ClienteSaludHttp());
app.mount('#app');
