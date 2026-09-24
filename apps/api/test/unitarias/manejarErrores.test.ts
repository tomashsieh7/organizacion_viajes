import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { ErrorDeDominio } from '../../src/compartido/errores.js';
import { manejarErrores } from '../../src/middlewares/manejarErrores.js';

function appQueLanza(error: unknown) {
  const app = express();
  app.get('/x', () => {
    throw error;
  });
  app.use(manejarErrores);
  return app;
}

describe('manejarErrores', () => {
  it.each([
    ['VALIDACION', 400],
    ['NO_AUTENTICADO', 401],
    ['PROHIBIDO', 403],
    ['NO_ENCONTRADO', 404],
    ['CONFLICTO', 409],
    ['REGLA_DE_NEGOCIO', 422],
    ['DEMASIADOS_INTENTOS', 429],
  ] as const)('traduce la categoría %s al estado %i', async (categoria, estado) => {
    const respuesta = await request(appQueLanza(new ErrorDeDominio(categoria, 'X', 'm'))).get('/x');
    expect(respuesta.status).toBe(estado);
  });

  it('incluye código, mensaje y detalles del error de dominio', async () => {
    const error = new ErrorDeDominio('REGLA_DE_NEGOCIO', 'PAGO_EXCEDE_DEUDA', 'Excede', {
      saldo: 10,
    });
    const respuesta = await request(appQueLanza(error)).get('/x');
    expect(respuesta.body).toEqual({
      error: { codigo: 'PAGO_EXCEDE_DEUDA', mensaje: 'Excede', detalles: { saldo: 10 } },
    });
  });

  it('oculta los errores inesperados detrás de un 500 ERROR_INTERNO', async () => {
    const consola = vi.spyOn(console, 'error').mockImplementation(() => {});
    const respuesta = await request(appQueLanza(new Error('detalle interno'))).get('/x');
    expect(respuesta.status).toBe(500);
    expect(respuesta.body).toEqual({
      error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error inesperado' },
    });
    consola.mockRestore();
  });
});
