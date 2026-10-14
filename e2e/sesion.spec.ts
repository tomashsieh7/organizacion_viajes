import { expect, nuevoViajero, test, viajeCon } from './soporte/fixtures.js';

test('RN-S5: si la sesión se pierde a mitad de uso, lleva al ingreso y después vuelve a la misma página', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const viajeId = await viajeCon(ana);
  const p = ana.page;
  await p.goto(`/viajes/${viajeId}/participantes`);
  await expect(p.getByRole('heading', { name: 'Bariloche 2026' })).toBeVisible();

  // La sesión se cierra por fuera de esta pestaña, como si se hubiera cerrado en otra.
  await p.evaluate(() => fetch('/api/auth/sesion', { method: 'DELETE' }));
  await p
    .getByRole('link', { name: /Cuentas/ })
    .first()
    .click();

  await expect(p).toHaveURL(/\/ingresar\?/);
  await expect(p.getByRole('status')).toContainText('Tu sesión terminó');
  await p.getByLabel('Email').fill(ana.email);
  await p.getByLabel('Contraseña').fill('una-clave-segura');
  await p.getByRole('button', { name: 'Ingresar' }).click();
  await expect(p).toHaveURL(new RegExp(`/viajes/${viajeId}/gastos$`));
  await expect(p.getByRole('heading', { name: 'Gastos', exact: true })).toBeVisible();
});
