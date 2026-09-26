import type { RequestHandler } from 'express';
import { ErrorDeDominio } from '../compartido/errores.js';
import type { ObtenerUsuarioDeSesion } from '../modulos/auth/casos-de-uso/casosDeUsoAuth.js';
import type { ConsultarAcceso } from '../modulos/viajes/casos-de-uso/casosDeUsoViajes.js';
import type { ConsultaViajes } from '../modulos/viajes/dominio/puertos.js';

export const NOMBRE_COOKIE_SESION = 'sesion';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Exige una sesión vigente y deja el usuario en `req.usuarioId`. */
export function autenticado(obtenerUsuario: ObtenerUsuarioDeSesion): RequestHandler {
  return async (req, _res, next) => {
    try {
      req.usuarioId = await obtenerUsuario.ejecutar(req.cookies?.[NOMBRE_COOKIE_SESION]);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/** RN-X1: exige membresía activa en el viaje de la ruta y deja el rol en `req.acceso`. */
export function participanteActivo(
  consultas: Pick<ConsultaViajes, 'obtenerAcceso'>,
): RequestHandler {
  return async (req, _res, next) => {
    try {
      const viajeId = String(req.params['viajeId']);
      if (!UUID.test(viajeId))
        throw new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'El viaje no existe');
      const acceso = await consultas.obtenerAcceso(viajeId, req.usuarioId ?? '');
      if (!acceso) {
        throw new ErrorDeDominio('PROHIBIDO', 'NO_PARTICIPANTE', 'No participás de este viaje');
      }
      req.acceso = { viajeId, rol: acceso.rol, tipo: 'COMPLETO' };
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * RN-E6: para la sección de saldos alcanza con participar o con haberse ido con saldos
 * pendientes. Deja en `req.acceso` el tipo de acceso.
 */
export function accesoSaldos(consultarAcceso: ConsultarAcceso): RequestHandler {
  return async (req, _res, next) => {
    try {
      const viajeId = String(req.params['viajeId']);
      if (!UUID.test(viajeId))
        throw new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'El viaje no existe');
      req.acceso = { viajeId, ...(await consultarAcceso.ejecutar(viajeId, req.usuarioId ?? '')) };
      next();
    } catch (error) {
      next(error);
    }
  };
}

/** RN-X2: la acción es del Admin del viaje. */
export const soloAdmin: RequestHandler = (req, _res, next) => {
  if (req.acceso?.rol === 'ADMIN') {
    next();
    return;
  }
  next(new ErrorDeDominio('PROHIBIDO', 'SOLO_ADMIN', 'Solo el Admin del viaje puede hacer esto'));
};

/** Valida que un parámetro de ruta sea un identificador válido; si no, responde 404. */
export function parametroUuid(nombre: string): RequestHandler {
  return (req, _res, next) => {
    if (UUID.test(String(req.params[nombre]))) {
      next();
      return;
    }
    next(new ErrorDeDominio('NO_ENCONTRADO', 'NO_ENCONTRADO', 'No existe el recurso pedido'));
  };
}
