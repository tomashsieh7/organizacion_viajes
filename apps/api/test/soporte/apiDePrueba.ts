import request from 'supertest';
import type { Express } from 'express';
import { crearApp } from '../../src/app.js';
import { leerConfig } from '../../src/config.js';
import { crearContenedor, type Contenedor } from '../../src/contenedor.js';
import { URL_BASE_DE_PRUEBA } from './baseDePrueba.js';

export const ORIGEN = 'http://localhost:5173';

export function crearApiDePrueba(entorno: Record<string, string> = {}): {
  app: Express;
  contenedor: Contenedor;
} {
  const contenedor = crearContenedor(
    leerConfig({
      NODE_ENV: 'test',
      DATABASE_URL: URL_BASE_DE_PRUEBA,
      ORIGEN_WEB: ORIGEN,
      ...entorno,
    }),
  );
  return { app: crearApp(contenedor), contenedor };
}

/** Cliente HTTP que conserva la cookie de sesión y manda el Origin de la aplicación. */
export function cliente(app: Express) {
  const agente = request.agent(app);
  return {
    agente,
    get: (url: string) => agente.get(url),
    post: (url: string, cuerpo?: object) =>
      agente
        .post(url)
        .set('Origin', ORIGEN)
        .send(cuerpo ?? {}),
    delete: (url: string) => agente.delete(url).set('Origin', ORIGEN),
  };
}

export type Cliente = ReturnType<typeof cliente>;

/** Registra un usuario por la API y devuelve su cliente con la sesión iniciada. */
export async function registrar(
  app: Express,
  nombre: string,
  email: string,
): Promise<{ c: Cliente; id: string }> {
  const c = cliente(app);
  const r = await c.post('/api/auth/registro', { email, password: 'una-clave-segura', nombre });
  if (r.status !== 201) throw new Error(`No se pudo registrar ${email}: ${JSON.stringify(r.body)}`);
  return { c, id: r.body.usuario.id };
}
