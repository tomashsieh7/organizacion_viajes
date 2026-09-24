import { createServer } from 'node:http';
import { crearApp } from './app.js';
import { leerConfig } from './config.js';
import { crearContenedor } from './contenedor.js';
import { conectarTiempoReal } from './tiempoReal.js';

try {
  process.loadEnvFile();
} catch {
  // Sin archivo .env se usan las variables del entorno y los valores por defecto.
}

const config = leerConfig();
const contenedor = crearContenedor(config);
const servidor = createServer(crearApp(contenedor));
conectarTiempoReal(servidor, contenedor);

servidor.listen(config.PORT, () => {
  console.log(`API escuchando en http://localhost:${config.PORT}`);
});
