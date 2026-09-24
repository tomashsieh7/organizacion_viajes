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
  await expect(p.locator('li', { hasText: 'Tomás' })).toContainText('Admin');

  // Tomás, en el viaje abierto, pasa a ver las acciones de Admin.
  await tomas.page.goto(`/viajes/${viajeId}/participantes`);
  await expect(
    tomas.page.getByRole('button', { name: 'Transferir la administración' }),
  ).toBeVisible();

  await p.getByRole('button', { name: 'Salir del grupo' }).click();
  await p.getByRole('dialog').getByRole('button', { name: 'Salir del grupo' }).click();
  await expect(p).toHaveURL(/\/viajes$/);
  await expect(p.getByText('Todavía no participás de ningún viaje.')).toBeVisible();

  await tomas.page.reload();
  await expect(tomas.page.locator('li', { hasText: 'Ana' })).toHaveCount(0);
});
