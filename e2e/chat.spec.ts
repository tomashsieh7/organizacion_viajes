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

test('reacciones, "escribiendo…" y mensajes sin leer en la lista de grupos', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const tomas = await nuevoViajero(browser, 'Tomás');
  const viajeId = await viajeCon(ana, tomas);

  await ana.page.goto(`/viajes/${viajeId}/chat`);
  await ana.page.fill('#mensaje', 'Llegamos al refugio');
  await ana.page.press('#mensaje', 'Enter');
  await ana.page.fill('#mensaje', '¿Quién trae la cena?');
  await ana.page.press('#mensaje', 'Enter');
  await expect(ana.page.locator('.mensaje[data-estado="enviado"]')).toHaveCount(2);

  // Tomás ve en la lista los dos mensajes sin leer y la última novedad.
  await tomas.page.goto('/viajes');
  const fila = tomas.page.locator('.grupo');
  await expect(fila.locator('.grupo__novedad')).toHaveText('Ana: ¿Quién trae la cena?');
  await expect(fila.locator('.grupo__sin-leer')).toContainText('2 mensajes sin leer');

  // Al abrir el chat se marcan leídos.
  await tomas.page.goto(`/viajes/${viajeId}/chat`);
  await expect(tomas.page.locator('.mensaje')).toHaveCount(2);

  // Tomás escribe y Ana lo ve.
  await tomas.page.fill('#mensaje', 'Yo');
  await expect(ana.page.locator('.escribiendo')).toHaveText('Tomás está escribiendo…');

  // Tomás reacciona y Ana ve la reacción.
  const primero = tomas.page.locator('.mensaje', { hasText: 'Llegamos al refugio' });
  await primero.getByRole('button', { name: 'Reaccionar', exact: true }).click();
  await tomas.page.getByRole('button', { name: 'Reaccionar con 🎉' }).click();
  const deAna = ana.page
    .locator('.mensaje', { hasText: 'Llegamos al refugio' })
    .locator('.reaccion');
  await expect(deAna).toHaveAttribute('aria-label', '🎉 de Tomás');
  // Ana suma la misma; tocarla otra vez la quita.
  await deAna.click();
  await expect(deAna).toHaveAttribute('aria-label', '🎉 de Tomás y vos');
  await deAna.click();
  await expect(deAna).toHaveAttribute('aria-label', '🎉 de Tomás');

  await tomas.page.goto('/viajes');
  await expect(tomas.page.locator('.grupo__sin-leer')).toHaveCount(0);
});
