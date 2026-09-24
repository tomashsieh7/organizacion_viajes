import type { RequestHandler } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { ErrorDeDominio } from '../compartido/errores.js';

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * RN-S6: toda petición que modifica datos debe venir del origen de la aplicación. Junto con la
 * cookie `SameSite=Lax` protege contra CSRF. Un cliente que no manda `Origin` también se rechaza.
 */
export function verificarOrigen(origenPermitido: string): RequestHandler {
  return (req, _res, next) => {
    if (METODOS_SEGUROS.has(req.method) || req.get('origin') === origenPermitido) {
      next();
      return;
    }
    next(
      new ErrorDeDominio(
        'PROHIBIDO',
        'ORIGEN_NO_PERMITIDO',
        'La petición no viene del origen permitido',
      ),
    );
  };
}

const demasiadosIntentos: RequestHandler = (_req, _res, next) =>
  next(
    new ErrorDeDominio(
      'DEMASIADOS_INTENTOS',
      'DEMASIADOS_INTENTOS',
      'Hubo demasiados intentos; esperá unos minutos y volvé a probar',
    ),
  );

const QUINCE_MINUTOS = 15 * 60 * 1000;

/**
 * RN-S4: tras 5 ingresos fallidos por IP o por email en 15 minutos se bloquean nuevos intentos.
 * Solo cuentan las respuestas con error. Se crean por instancia de la app para que las pruebas
 * no compartan contadores.
 */
export function limitesDeIngreso(): RequestHandler[] {
  const comun = {
    windowMs: QUINCE_MINUTOS,
    limit: 5,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8' as const,
    legacyHeaders: false,
    handler: demasiadosIntentos,
  };
  return [
    rateLimit({ ...comun, keyGenerator: (req) => `ip:${ipKeyGenerator(req.ip ?? '')}` }),
    rateLimit({
      ...comun,
      keyGenerator: (req) => {
        const email: unknown = req.body?.email;
        return `email:${typeof email === 'string' ? email.trim().toLowerCase() : ''}`;
      },
    }),
  ];
}

/** Límite general al registro por IP, para frenar la creación masiva de cuentas (D6). */
export function limiteDeRegistro(porHora: number): RequestHandler {
  return rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: porHora,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req) => `ip:${ipKeyGenerator(req.ip ?? '')}`,
    handler: demasiadosIntentos,
  });
}
