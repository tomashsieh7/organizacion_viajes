import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Contenedor } from './contenedor.js';
import { accesoSaldos, autenticado, participanteActivo } from './middlewares/acceso.js';
import { manejarErrores, rutaNoEncontrada } from './middlewares/manejarErrores.js';
import { verificarOrigen } from './middlewares/seguridad.js';
import { rutasAuth } from './modulos/auth/auth.rutas.js';
import { rutasSalud } from './modulos/salud/salud.rutas.js';
import {
  rutasDelViaje,
  rutasDelViajeConSaldos,
  rutasViajes,
} from './modulos/viajes/viajes.rutas.js';
import { rutasDeCategorias, rutasDeGastos, rutasDeSaldos } from './modulos/gastos/gastos.rutas.js';
import { rutasDeAlojamientos } from './modulos/alojamientos/alojamientos.rutas.js';
import { rutasDeActividades } from './modulos/actividades/actividades.rutas.js';
import { rutasDeItinerario } from './modulos/itinerario/itinerario.rutas.js';
import { rutasDeChat } from './modulos/chat/chat.rutas.js';
import { rutasDePropuestas } from './modulos/propuestas/propuestas.rutas.js';

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
  api.use(rutasViajes({ ...c.viajes, autenticado: exigirSesion }));
  api.use(rutasDeCategorias(c.gastos.consultar, exigirSesion));

  // RN-E6: el detalle del viaje y los saldos también los ve quien se fue con saldos pendientes.
  // La guarda se aplica solo a esas rutas; el resto sigue de largo al router de viaje.
  const guardaSaldos = [exigirSesion, accesoSaldos(c.viajes.consultarAcceso)];
  api.use('/viajes/:viajeId', rutasDelViajeConSaldos(c.viajes.consultar, guardaSaldos));
  api.use('/viajes/:viajeId', rutasDeSaldos(c.gastos, guardaSaldos));

  // Rutas dentro de un viaje: la sesión y la membresía activa se verifican una sola vez (RN-X1).
  const viaje = express.Router({ mergeParams: true });
  viaje.use(exigirSesion, participanteActivo(c.viajes.consultas));
  viaje.use(rutasDelViaje(c.viajes));
  viaje.use(rutasDePropuestas(c.propuestas));
  viaje.use(rutasDeAlojamientos(c.alojamientos));
  viaje.use(rutasDeActividades(c.actividades));
  viaje.use(rutasDeItinerario(c.itinerario));
  viaje.use(rutasDeChat(c.chat.consultar));
  viaje.use(rutasDeGastos(c.gastos));
  api.use('/viajes/:viajeId', viaje);
  api.use(rutaNoEncontrada);

  app.use('/api', api);
  app.use(manejarErrores);
  return app;
}
