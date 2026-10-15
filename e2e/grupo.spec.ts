import { expect, nuevoViajero, test } from './soporte/fixtures.js';

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
