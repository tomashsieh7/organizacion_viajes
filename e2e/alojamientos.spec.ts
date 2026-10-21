import { api, expect, nuevoViajero, test, viajeCon } from './soporte/fixtures.js';

const CABANA = {
  nombre: 'Cabaña del lago',
  descripcion: 'Con vista al lago',
  ubicacion: 'Bariloche',
  fechaDesde: '2026-12-10',
  fechaHasta: '2026-12-12',
};

test('CU05: si la respuesta de proponer se pierde y se reintenta, queda una sola propuesta', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const viajeId = await viajeCon(ana);
  const p = ana.page;
  let primera = true;
  // El servidor guarda la propuesta, pero la respuesta no llega, como con mala señal.
  await p.route('**/alojamientos', async (r) => {
    if (r.request().method() !== 'POST' || !primera) return r.continue();
    primera = false;
    await r.fetch();
    await r.abort('connectionreset');
  });
  await p.goto(`/viajes/${viajeId}/alojamientos/nuevo`);
  await p.fill('#alojamiento-nombre', 'Con mala señal');
  await p.fill('#alojamiento-descripcion', 'Con vista al lago');
  await p.fill('#ubicacion', 'Bahía');
  await p.getByRole('option').first().click();
  await p.getByRole('button', { name: /Proponer/ }).click();
  await expect(p.getByText('No se pudo contactar al servidor')).toBeVisible();
  await p.getByRole('button', { name: /Proponer/ }).click();
  await expect(p).toHaveURL(/\/alojamientos$/);

  const { alojamientos } = await api<{ alojamientos: { alojamiento: { nombre: string } }[] }>(
    ana,
    'GET',
    `/viajes/${viajeId}/alojamientos`,
  );
  expect(alojamientos.filter((a) => a.alojamiento.nombre === 'Con mala señal')).toHaveLength(1);
});

test('RN-R1: denegar pide confirmación, y votar algo ya resuelto muestra cómo quedó', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const beto = await nuevoViajero(browser, 'Beto');
  const viajeId = await viajeCon(ana, beto);
  const { alojamiento } = await api<{ alojamiento: { id: string } }>(
    beto,
    'POST',
    `/viajes/${viajeId}/alojamientos`,
    CABANA,
  );

  // Beto tiene la lista abierta mientras Ana resuelve.
  await beto.page.goto(`/viajes/${viajeId}/alojamientos`);
  await expect(beto.page.getByRole('button', { name: 'A favor' })).toBeVisible();

  const p = ana.page;
  await p.goto(`/viajes/${viajeId}/alojamientos`);
  await p.getByRole('button', { name: 'Denegar' }).click();
  await expect(p.getByRole('dialog')).toContainText(
    '¿Denegar «Cabaña del lago»? No se puede deshacer.',
  );
  await p.getByRole('button', { name: 'Volver' }).click();
  await expect(p.getByRole('dialog')).toHaveCount(0);
  await p.getByRole('button', { name: 'Denegar' }).click();
  await p.getByRole('button', { name: 'Sí, denegar' }).click();
  await expect(p.locator('article', { hasText: 'Cabaña del lago' })).toContainText('Denegada');

  await beto.page.getByRole('button', { name: 'A favor' }).click();
  await expect(beto.page.getByRole('alert')).toContainText('ya fue resuelta');
  await expect(beto.page.getByRole('button', { name: 'A favor' })).toHaveCount(0);
  await expect(beto.page.locator('article', { hasText: 'Cabaña del lago' })).toContainText(
    'Denegada',
  );
  expect(alojamiento.id).toBeTruthy();
});
