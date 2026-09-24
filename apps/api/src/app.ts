import express, { type Express } from 'express';
import type { Contenedor } from './contenedor.js';
import { manejarErrores, rutaNoEncontrada } from './middlewares/manejarErrores.js';
import { rutasSalud } from './modulos/salud/salud.rutas.js';

/** Arma la aplicación Express con las rutas de la API y el manejo de errores. */
export function crearApp(_contenedor: Contenedor): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  const api = express.Router();
  api.use(rutasSalud());
  api.use(rutaNoEncontrada);

  app.use('/api', api);
  app.use(manejarErrores);
  return app;
}
