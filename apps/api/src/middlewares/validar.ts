import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { ErrorDeDominio } from '../compartido/errores.js';

/** Valida el cuerpo con un esquema compartido (D12) y lo reemplaza por el valor ya normalizado. */
export function validar(esquema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    const resultado = esquema.safeParse(req.body ?? {});
    if (!resultado.success) {
      const detalles = resultado.error.issues.map((i) => ({
        campo: i.path.join('.'),
        mensaje: i.message,
      }));
      next(new ErrorDeDominio('VALIDACION', 'VALIDACION', 'Hay datos inválidos', detalles));
      return;
    }
    req.body = resultado.data;
    next();
  };
}
