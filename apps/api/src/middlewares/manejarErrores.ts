import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { RespuestaError } from '@viajes/compartido';
import { ErrorDeDominio, type CategoriaError } from '../compartido/errores.js';

const ESTADO_HTTP: Record<CategoriaError, number> = {
  VALIDACION: 400,
  NO_AUTENTICADO: 401,
  PROHIBIDO: 403,
  NO_ENCONTRADO: 404,
  CONFLICTO: 409,
  REGLA_DE_NEGOCIO: 422,
  DEMASIADOS_INTENTOS: 429,
};

/** Responde 404 con el formato común a cualquier ruta de la API que no exista. */
export const rutaNoEncontrada: RequestHandler = (req, _res, next) => {
  next(
    new ErrorDeDominio(
      'NO_ENCONTRADO',
      'NO_ENCONTRADO',
      `No existe la ruta ${req.method} ${req.path}`,
    ),
  );
};

function esJsonMalformado(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { type?: unknown }).type === 'entity.parse.failed'
  );
}

/** Convierte cualquier error en una respuesta `{ error: { codigo, mensaje, detalles } }`. */
export const manejarErrores: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  let estado = 500;
  let cuerpo: RespuestaError = {
    error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error inesperado' },
  };

  if (error instanceof ErrorDeDominio) {
    estado = ESTADO_HTTP[error.categoria];
    cuerpo = { error: { codigo: error.codigo, mensaje: error.message } };
    if (error.detalles !== undefined) cuerpo.error.detalles = error.detalles;
  } else if (esJsonMalformado(error)) {
    estado = 400;
    cuerpo = { error: { codigo: 'VALIDACION', mensaje: 'El cuerpo no es un JSON válido' } };
  } else {
    console.error(error);
  }

  res.status(estado).json(cuerpo);
};
