import { api, expect, nuevoViajero, test, viajeCon } from './soporte/fixtures.js';

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

test('CU27: el Admin corre el viaje una semana desde Gestión del grupo y las propuestas lo siguen', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const tomas = await nuevoViajero(browser, 'Tomás');
  const viajeId = await viajeCon(ana, tomas);
  const kayak = await api<{ actividad: { id: string } }>(
    tomas,
    'POST',
    `/viajes/${viajeId}/actividades`,
    {
      titulo: 'Kayak',
      ubicacion: 'Lago',
      latitud: -41.1,
      longitud: -71.4,
      fecha: '2026-12-15',
      horaInicio: '10:00',
      duracionMin: 60,
    },
  );

  const p = ana.page;
  await p.goto(`/viajes/${viajeId}/resumen`);
  await p.getByRole('link', { name: '2 viajeros, gestión del grupo' }).click();
  await expect(p.getByRole('heading', { name: 'Gestión del grupo' })).toBeVisible();
  await p.getByRole('button', { name: 'Editar' }).click();
  const dialogo = p.getByRole('dialog');

  // Achicado, el kayak del martes 15 queda afuera y se ofrece elegir sus días.
  await dialogo.getByLabel('Hasta').fill('2026-12-13');
  await expect(dialogo.getByText('Quedan afuera 1 propuesta.')).toBeVisible();
  await expect(dialogo.getByRole('button', { name: 'Elegir días' })).toBeEnabled();
  await dialogo.getByText('Ver cuáles').click();
  await expect(dialogo.getByRole('link', { name: /Kayak/ })).toBeVisible();

  // Corrido una semana, se avisa y al guardar el kayak pasa al martes 22.
  await dialogo.getByLabel('Desde').fill('2026-12-17');
  await dialogo.getByLabel('Hasta').fill('2026-12-23');
  await expect(
    dialogo.getByText('Al guardar, las propuestas se corren 1 semana para adelante.'),
  ).toBeVisible();
  await dialogo.getByLabel('Nombre').fill('Bariloche corrido');
  await dialogo.getByRole('button', { name: 'Guardar' }).click();
  await expect(p.getByText('Las propuestas se corrieron 1 semana para adelante.')).toBeVisible();
  await expect(p.getByRole('heading', { level: 1 })).toHaveText('Bariloche corrido');

  const { actividad } = await api<{ actividad: { actividad: { fecha: string } } }>(
    tomas,
    'GET',
    `/viajes/${viajeId}/actividades/${kayak.actividad.id}`,
  );
  expect(actividad.actividad.fecha).toBe('2026-12-22');

  // Un viajero ve los datos pero no puede editarlos.
  await tomas.page.goto(`/viajes/${viajeId}/participantes`);
  await expect(tomas.page.getByText('17 al 23 dic 2026').first()).toBeVisible();
  await expect(tomas.page.getByRole('button', { name: 'Editar' })).toHaveCount(0);
});
