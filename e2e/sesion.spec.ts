import { expect, nuevoViajero, test, viajeCon } from './soporte/fixtures.js';

test('RN-S5: si la sesión se pierde a mitad de uso, lleva al ingreso y después vuelve a la misma página', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const viajeId = await viajeCon(ana);
  const p = ana.page;
  await p.goto(`/viajes/${viajeId}/participantes`);
  await expect(p.getByRole('heading', { name: 'Bariloche 2026' })).toBeVisible();

  // La cookie desaparece, como cuando la sesión vence: el servidor no corta el chat y la pérdida
  // se nota recién en el próximo pedido.
  await p.context().clearCookies();
  await p
    .getByRole('link', { name: /Cuentas/ })
    .first()
    .click();

  await expect(p).toHaveURL(/\/ingresar\?/);
  await expect(p.getByRole('status').filter({ hasText: 'Tu sesión terminó' })).toBeVisible();
  await p.getByLabel('Email').fill(ana.email);
  await p.getByLabel('Contraseña').fill('una-clave-segura');
  await p.getByRole('button', { name: 'Ingresar' }).click();
  await expect(p).toHaveURL(new RegExp(`/viajes/${viajeId}/gastos$`));
  await expect(p.getByRole('heading', { name: 'Gastos', exact: true })).toBeVisible();
});

test('RN-S5: al cerrar sesión en una pestaña, la que tiene el chat abierto deja de recibirlo y lleva al ingreso', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const beto = await nuevoViajero(browser, 'Beto');
  const viajeId = await viajeCon(ana, beto);
  const otraPestana = await ana.page.context().newPage();
  await otraPestana.goto(`/viajes/${viajeId}/chat`);
  await expect(otraPestana.getByRole('heading', { name: 'Bariloche 2026' })).toBeVisible();

  await ana.page.goto('/viajes');
  await ana.page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(ana.page).toHaveURL(/\/ingresar$/);

  await expect(otraPestana).toHaveURL(/\/ingresar\?/);
  await expect(
    otraPestana.getByRole('status').filter({ hasText: 'Tu sesión terminó' }),
  ).toBeVisible();

  await beto.page.goto(`/viajes/${viajeId}/chat`);
  await beto.page.fill('#mensaje', 'Después del cierre');
  await beto.page.press('#mensaje', 'Enter');
  await expect(beto.page.getByText('Después del cierre')).toBeVisible();
  await expect(otraPestana.getByText('Después del cierre')).toHaveCount(0);
});

test('RN-S5: quien cierra sesión desde un viaje no ve el aviso de sesión terminada, aunque la respuesta tarde', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const viajeId = await viajeCon(ana);
  const p = ana.page;
  // La respuesta del cierre llega después de que el servidor corta el chat de esta pestaña.
  await p.route('**/api/auth/sesion', async (r) => {
    if (r.request().method() !== 'DELETE') return r.continue();
    const respuesta = await r.fetch();
    await new Promise((listo) => setTimeout(listo, 1000));
    await r.fulfill({ response: respuesta });
  });
  await p.goto(`/viajes/${viajeId}/chat`);
  await expect(p.getByRole('heading', { name: 'Bariloche 2026' })).toBeVisible();
  await p.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(p).toHaveURL(/\/ingresar$/);
  await expect(p.getByRole('heading', { name: 'Ingresar' })).toBeVisible();
  await expect(p.getByText('Tu sesión terminó')).toHaveCount(0);
});
