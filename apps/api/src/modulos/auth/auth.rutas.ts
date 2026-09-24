import { Router, type CookieOptions, type Response } from 'express';
import { esquemaInicioSesion, esquemaRegistro, type RespuestaUsuario } from '@viajes/compartido';
import { NOMBRE_COOKIE_SESION } from '../../middlewares/acceso.js';
import { limiteDeRegistro, limitesDeIngreso } from '../../middlewares/seguridad.js';
import { validar } from '../../middlewares/validar.js';
import type { RequestHandler } from 'express';
import type {
  CerrarSesion,
  IniciarSesion,
  ObtenerPerfil,
  Registrarse,
  ResultadoIngreso,
} from './casos-de-uso/casosDeUsoAuth.js';

export interface DependenciasRutasAuth {
  registrarse: Registrarse;
  iniciarSesion: IniciarSesion;
  cerrarSesion: CerrarSesion;
  obtenerPerfil: ObtenerPerfil;
  autenticado: RequestHandler;
  cookieSegura: boolean;
  /** Registros permitidos por hora y por IP. */
  registrosPorHora: number;
}

/** Controlador y rutas de `/api/auth` (sección 5.2 de PLAN.md). */
export function rutasAuth(deps: DependenciasRutasAuth): Router {
  const opcionesCookie = (expira?: Date): CookieOptions => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: deps.cookieSegura,
    path: '/',
    ...(expira ? { expires: expira } : {}),
  });

  const responderIngreso = (
    res: Response,
    estado: number,
    { cuenta, sesion }: ResultadoIngreso,
  ) => {
    res.cookie(NOMBRE_COOKIE_SESION, sesion.token, opcionesCookie(sesion.expiraEn));
    const cuerpo: RespuestaUsuario = {
      usuario: { id: cuenta.usuarioId, nombre: cuenta.nombre, apodo: cuenta.apodo },
    };
    res.status(estado).json(cuerpo);
  };

  const router = Router();

  router.post(
    '/registro',
    limiteDeRegistro(deps.registrosPorHora),
    validar(esquemaRegistro),
    async (req, res) => {
      responderIngreso(res, 201, await deps.registrarse.ejecutar(req.body));
    },
  );

  router.post('/sesion', ...limitesDeIngreso(), validar(esquemaInicioSesion), async (req, res) => {
    responderIngreso(res, 200, await deps.iniciarSesion.ejecutar(req.body));
  });

  router.delete('/sesion', async (req, res) => {
    await deps.cerrarSesion.ejecutar(req.cookies?.[NOMBRE_COOKIE_SESION]);
    res.clearCookie(NOMBRE_COOKIE_SESION, opcionesCookie());
    res.status(204).end();
  });

  router.get('/yo', deps.autenticado, async (req, res) => {
    const cuenta = await deps.obtenerPerfil.ejecutar(req.usuarioId ?? '');
    const cuerpo: RespuestaUsuario = {
      usuario: { id: cuenta.usuarioId, nombre: cuenta.nombre, apodo: cuenta.apodo },
    };
    res.json(cuerpo);
  });

  return router;
}
