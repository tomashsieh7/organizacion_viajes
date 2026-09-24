import { createServer } from 'node:http';
import { crearApp } from './app.js';
import { leerConfig } from './config.js';
import { crearContenedor } from './contenedor.js';

try {
  process.loadEnvFile();
} catch {
  // Sin archivo .env se usan las variables del entorno y los valores por defecto.
}

const config = leerConfig();
const app = crearApp(crearContenedor(config));
const servidor = createServer(app);

servidor.listen(config.PORT, () => {
  console.log(`API escuchando en http://localhost:${config.PORT}`);
});
