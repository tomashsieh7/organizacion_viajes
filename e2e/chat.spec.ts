import { expect, nuevoViajero, test, viajeCon } from './soporte/fixtures.js';

test('CU19: conversar en el chat desde dos sesiones', async ({ browser }) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const tomas = await nuevoViajero(browser, 'Tomás');
  const viajeId = await viajeCon(ana, tomas);

  await ana.page.goto(`/viajes/${viajeId}/chat`);
  await tomas.page.goto(`/viajes/${viajeId}/chat`);
  await expect(ana.page.getByText('Todavía no hay mensajes')).toBeVisible();
  await expect(tomas.page.getByText('Todavía no hay mensajes')).toBeVisible();

  await ana.page.fill('#mensaje', '¿Salimos a las 9?');
  await ana.page.press('#mensaje', 'Enter');
  const recibido = tomas.page.locator('.mensaje', { hasText: '¿Salimos a las 9?' });
  await expect(recibido).toContainText('Ana');
  await expect(ana.page.locator('.mensaje.propio[data-estado="enviado"]')).toContainText('Vos');

  await tomas.page.fill('#mensaje', 'Dale, llevo el mate');
  await tomas.page.getByRole('button', { name: 'Enviar' }).click();
  await expect(ana.page.locator('.mensaje', { hasText: 'llevo el mate' })).toContainText('Tomás');

  // El historial se conserva al volver a entrar.
  await tomas.page.reload();
  await expect(tomas.page.locator('.mensaje')).toHaveCount(2);
});
