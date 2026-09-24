import {
  test as base,
  expect,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test';
import type { DetalleViaje } from '@viajes/compartido';
import { ORIGEN_WEB } from './constantes.js';

export { expect };

/** Un viajero con su propia sesión, en su propio contexto del navegador. */
export interface Viajero {
  page: Page;
  id: string;
  nombre: string;
  email: string;
}

let contador = 0;
/** Contextos abiertos por `nuevoViajero`; se cierran al terminar cada prueba. */
const contextos: BrowserContext[] = [];

/**
 * Evita depender de servicios externos: las teselas del mapa no se descargan y Nominatim responde
 * siempre el mismo lugar, así el campo de ubicación ofrece un resultado para elegir.
 */
async function sinServiciosExternos(page: Page) {
  await page.route('https://tile.openstreetmap.org/**', (r) => r.abort());
  await page.route('https://nominatim.openstreetmap.org/**', (r) =>
    r.fulfill({
      json: [{ display_name: 'Bahía López, Bariloche', lat: '-41.08', lon: '-71.55' }],
    }),
  );
}

/** Llama a la API con la sesión del viajero; se usa para preparar datos que la prueba no mira. */
export async function api<T>(v: Viajero, metodo: 'GET' | 'POST', ruta: string, datos?: object) {
  const r = await v.page.request.fetch(`/api${ruta}`, {
    method: metodo,
    headers: { Origin: ORIGEN_WEB },
    ...(datos ? { data: datos } : {}),
  });
  if (!r.ok()) throw new Error(`${metodo} ${ruta}: ${r.status()} ${await r.text()}`);
  return (r.status() === 204 ? undefined : await r.json()) as T;
}

/** Registra un viajero por la API, con sesión iniciada en un contexto nuevo. */
export async function nuevoViajero(browser: Browser, nombre: string): Promise<Viajero> {
  const contexto = await browser.newContext();
  contextos.push(contexto);
  const page = await contexto.newPage();
  await sinServiciosExternos(page);
  const email = `${nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z]/g, '')}-${Date.now()}-${++contador}@e2e.com`;
  const v: Viajero = { page, id: '', nombre, email };
  const r = await api<{ usuario: { id: string } }>(v, 'POST', '/auth/registro', {
    email,
    password: 'una-clave-segura',
    nombre,
  });
  v.id = r.usuario.id;
  return v;
}

/** Crea un viaje del 10 al 16 de diciembre de 2026 en pesos, con `admin` y los viajeros dados. */
export async function viajeCon(admin: Viajero, ...viajeros: Viajero[]): Promise<string> {
  const { viaje } = await api<{ viaje: DetalleViaje }>(admin, 'POST', '/viajes', {
    nombre: 'Bariloche 2026',
    destino: 'Bariloche',
    fechaInicio: '2026-12-10',
    fechaFin: '2026-12-16',
    monedaCodigo: 'ARS',
  });
  for (const v of viajeros) {
    await api(admin, 'POST', `/viajes/${viaje.id}/participantes`, { email: v.email });
  }
  return viaje.id;
}

export const test = base.extend<{ sinExternos: void }>({
  sinExternos: [
    async ({ page }, usar) => {
      await sinServiciosExternos(page);
      await usar();
      for (const c of contextos.splice(0)) await c.close();
    },
    { auto: true },
  ],
});
