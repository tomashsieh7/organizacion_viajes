import { expect, nuevoViajero, test, viajeCon } from './soporte/fixtures.js';

test('CU24 y CU04: transferir la administración y salir del grupo', async ({ browser }) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const tomas = await nuevoViajero(browser, 'Tomás');
  const viajeId = await viajeCon(ana, tomas);

  const p = ana.page;
  await p.goto(`/viajes/${viajeId}/participantes`);
  await p.getByRole('button', { name: 'Transferir la administración' }).click();
  await p.selectOption('#sucesor', { label: 'Tomás' });
  await p.getByRole('dialog').getByRole('button', { name: 'Transferir' }).click();
  await expect(p.getByRole('button', { name: 'Transferir la administración' })).toHaveCount(0);
  // Tomás pasa al grupo "Admin" de la lista de participantes.
  await expect(
    p.locator('.grupo-rol', { has: p.getByRole('heading', { name: 'Admin', exact: true }) }),
  ).toContainText('Tomás');

  // Tomás, en el viaje abierto, pasa a ver las acciones de Admin.
  await tomas.page.goto(`/viajes/${viajeId}/participantes`);
  await expect(
    tomas.page.getByRole('button', { name: 'Transferir la administración' }),
  ).toBeVisible();

  await p.getByRole('button', { name: 'Salir del grupo' }).click();
  await p.getByRole('dialog').getByRole('button', { name: 'Salir del grupo' }).click();
  await expect(p).toHaveURL(/\/viajes$/);
  await expect(p.getByText('Saliste de «Bariloche 2026».')).toBeVisible();
  await expect(p.getByText('Todavía no participás de ningún viaje.')).toBeVisible();

  await tomas.page.reload();
  await expect(tomas.page.locator('li', { hasText: 'Ana' })).toHaveCount(0);
});

test('RN-E4: a quien el Admin quita con el viaje abierto vuelve a la lista con un aviso', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const tomas = await nuevoViajero(browser, 'Tomás');
  const viajeId = await viajeCon(ana, tomas);

  await tomas.page.goto(`/viajes/${viajeId}/chat`);
  await expect(tomas.page.getByRole('heading', { name: 'Chat del grupo' })).toBeVisible();

  await ana.page.goto(`/viajes/${viajeId}/participantes`);
  await ana.page
    .locator('li', { hasText: 'Tomás' })
    .getByRole('button', { name: 'Eliminar' })
    .click();
  await ana.page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click();

  await expect(tomas.page).toHaveURL(/\/viajes$/);
  await expect(tomas.page.getByText('El Admin te quitó de «Bariloche 2026».')).toBeVisible();

  // Un viaje del que ya no participa muestra el error con un enlace para volver.
  await tomas.page.goto(`/viajes/${viajeId}/resumen`);
  await tomas.page.getByRole('link', { name: '← Volver a mis grupos' }).click();
  await expect(tomas.page).toHaveURL(/\/viajes$/);
});

test('CU03: si se pierde la respuesta al eliminar, la lista muestra que la persona ya no está', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const carla = await nuevoViajero(browser, 'Carla');
  const viajeId = await viajeCon(ana, carla);
  const p = ana.page;
  let primera = true;
  // El servidor elimina a Carla, pero la respuesta no llega, como con mala señal.
  await p.route(`**/participantes/${carla.id}`, async (r) => {
    if (r.request().method() !== 'DELETE' || !primera) return r.continue();
    primera = false;
    await r.fetch();
    await r.abort('connectionreset');
  });
  await p.goto(`/viajes/${viajeId}/participantes`);
  await p.getByRole('button', { name: 'Eliminar a Carla' }).click();
  await p.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click();
  await expect(p.getByText('No se pudo contactar al servidor')).toBeVisible();
  await expect(p.getByRole('button', { name: 'Eliminar a Carla' })).toHaveCount(0);
  await expect(p.locator('li', { hasText: 'Carla' })).toHaveCount(0);
});
