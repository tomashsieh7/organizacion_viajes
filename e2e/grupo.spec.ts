import { api, expect, nuevoViajero, test } from './soporte/fixtures.js';

test('CU01 y CU02: registrarse, crear un grupo de viaje y agregar a un viajero', async ({
  page,
  browser,
}) => {
  const tomas = await nuevoViajero(browser, 'Tomás');
  const email = `ana-${Date.now()}@e2e.com`;

  await page.goto('/registrarse');
  await page.fill('#nombre', 'Ana');
  await page.fill('#email', email);
  await page.fill('#password', 'una-clave-segura');
  await page.click('button[type=submit]');
  await expect(page).toHaveURL(/\/viajes$/);
  await expect(page.getByText('Todavía no participás de ningún viaje.')).toBeVisible();

  // CU01 en tres pasos: dónde, cuándo y con quién.
  await page.getByRole('button', { name: 'Nuevo grupo' }).click();
  await page.fill('#viaje-nombre', 'Bariloche 2026');
  await page.fill('#viaje-ciudad', 'Bariloche');
  await page.fill('#viaje-pais', 'Argentina');
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.fill('#viaje-inicio', '2026-12-10');
  await page.fill('#viaje-fin', '2026-12-16');
  await page.getByRole('button', { name: 'Crear viaje' }).click();
  await expect(page.getByText('Paso 3 de 3')).toBeVisible();

  // CU02 desde el mismo diálogo, con el viaje ya creado.
  await page.fill('#agregar-email', tomas.email);
  await page.getByRole('button', { name: 'Agregar' }).click();
  await expect(page.getByText(`Se agregó a ${tomas.email}`)).toBeVisible();
  await page.getByRole('button', { name: 'Ir al viaje' }).click();

  // El viaje nuevo abre en el Resumen, con el destino armado y los dos viajeros.
  await expect(page).toHaveURL(/\/resumen$/);
  await expect(page.getByRole('heading', { name: 'Bariloche 2026' })).toBeVisible();
  await expect(page.getByText('Bariloche, Argentina')).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Progreso del viaje' })).toBeVisible();
  await page.getByRole('link', { name: /2 viajeros/ }).click();
  await expect(page).toHaveURL(/\/participantes$/);
  await expect(page.locator('li', { hasText: 'Tomás' })).toBeVisible();

  // El viajero agregado ve el grupo en su lista.
  await tomas.page.goto('/viajes');
  await expect(tomas.page.getByText('Bariloche 2026')).toBeVisible();
});

test('CU01: si la respuesta de crear se pierde y se reintenta, queda un solo grupo', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const p = ana.page;
  let primera = true;
  // El servidor crea el viaje, pero la respuesta no llega, como con mala señal.
  await p.route('**/api/viajes', async (r) => {
    if (r.request().method() !== 'POST' || !primera) return r.continue();
    primera = false;
    await r.fetch();
    await r.abort('connectionreset');
  });
  await p.goto('/viajes');
  await p.getByRole('button', { name: 'Nuevo grupo' }).click();
  await p.fill('#viaje-nombre', 'Con mala señal');
  await p.fill('#viaje-ciudad', 'Bariloche');
  await p.getByRole('button', { name: 'Siguiente' }).click();
  await p.fill('#viaje-inicio', '2026-12-10');
  await p.fill('#viaje-fin', '2026-12-16');
  await p.getByRole('button', { name: 'Crear viaje' }).click();
  await expect(p.getByText('No se pudo contactar al servidor')).toBeVisible();
  await p.getByRole('button', { name: 'Crear viaje' }).click();
  await expect(p.getByText('Paso 3 de 3')).toBeVisible();

  const { viajes } = await api<{ viajes: { nombre: string }[] }>(ana, 'GET', '/viajes');
  expect(viajes.filter((v) => v.nombre === 'Con mala señal')).toHaveLength(1);
});

test('lista e Inicio: un viaje de un día y un viaje que ya terminó', async ({ browser }) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const p = ana.page;
  await p.clock.setFixedTime(new Date(2026, 11, 20, 12, 0));
  const crear = async (nombre: string, fechaInicio: string, fechaFin: string) =>
    (
      await api<{ viaje: { id: string } }>(ana, 'POST', '/viajes', {
        nombre,
        destino: 'Bariloche',
        fechaInicio,
        fechaFin,
        monedaCodigo: 'ARS',
      })
    ).viaje.id;
  await crear('Escapada', '2026-12-27', '2026-12-27');
  const terminado = await crear('Vacaciones', '2026-12-10', '2026-12-16');
  await p.goto('/viajes');
  await expect(p.locator('.tarjeta', { hasText: 'Escapada' })).toContainText('27 dic 2026');
  await expect(p.locator('.tarjeta', { hasText: 'Escapada' })).not.toContainText('27 al 27');

  await p.goto(`/viajes/${terminado}/resumen`);
  await expect(p.getByRole('heading', { name: 'El viaje terminó' })).toBeVisible();
  await expect(p.getByText('No queda nada pendiente')).toBeVisible();
  await expect(p.getByText('noches de alojamiento')).toHaveCount(0);
});
