import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { crearApp } from '../../src/app.js';
import { leerConfig } from '../../src/config.js';
import { crearContenedor } from '../../src/contenedor.js';

const app = crearApp(crearContenedor(leerConfig({ NODE_ENV: 'test' })));

describe('F0 — API base', () => {
  it('GET /api/salud responde 200 con { ok: true }', async () => {
    const respuesta = await request(app).get('/api/salud');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ ok: true });
  });

  it('una ruta inexistente responde 404 con el formato de error común (D19)', async () => {
    const respuesta = await request(app).get('/api/no-existe');
    expect(respuesta.status).toBe(404);
    expect(respuesta.body).toEqual({
      error: { codigo: 'NO_ENCONTRADO', mensaje: 'No existe la ruta GET /no-existe' },
    });
  });

  it('un JSON malformado responde 400 VALIDACION', async () => {
    const respuesta = await request(app)
      .post('/api/salud')
      .set('Content-Type', 'application/json')
      .send('{ roto');
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error.codigo).toBe('VALIDACION');
  });
});
