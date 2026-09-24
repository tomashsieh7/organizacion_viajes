import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Contenedor } from './contenedor.js';
import { autenticado, participanteActivo } from './middlewares/acceso.js';
import { manejarErrores, rutaNoEncontrada } from './middlewares/manejarErrores.js';
import { verificarOrigen } from './middlewares/seguridad.js';
import { rutasAuth } from './modulos/auth/auth.rutas.js';
import { rutasSalud } from './modulos/salud/salud.rutas.js';
import { rutasViajes } from './modulos/viajes/viajes.rutas.js';

/** Arma la aplicación Express con las rutas de la API y el manejo de errores. */
export function crearApp(c: Contenedor): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  const exigirSesion = autenticado(c.auth.obtenerUsuarioDeSesion);

  const api = express.Router();
  api.use(verificarOrigen(c.config.ORIGEN_WEB));
  api.use(rutasSalud());
  api.use(
    '/auth',
    rutasAuth({
      ...c.auth,
      autenticado: exigirSesion,
      cookieSegura: c.config.NODE_ENV === 'production',
    }),
  );
  api.use(
    rutasViajes({
      ...c.viajes,
      autenticado: exigirSesion,
      participanteActivo: participanteActivo(c.viajes.consultas),
    }),
  );
  api.use(rutaNoEncontrada);

  app.use('/api', api);
  app.use(manejarErrores);
  return app;
}
