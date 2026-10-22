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

test('RN-X9: un mensaje que falló se reintenta, y uno que llegó sin respuesta no queda fallado', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const tomas = await nuevoViajero(browser, 'Tomás');
  const viajeId = await viajeCon(ana, tomas);
  // Entre la página y el servidor: puede rechazar un envío o perder su respuesta, y cortar la conexión.
  let modo: 'normal' | 'rechazar' | 'perder' = 'normal';
  let cortar = () => {};
  await ana.page.routeWebSocket(/socket\.io/, (ws) => {
    const servidor = ws.connectToServer();
    cortar = () => ws.close();
    ws.onMessage((m) => {
      const envio = typeof m === 'string' && /^42\/chat,(\d+)\["chat:enviar"/.exec(m);
      if (envio && modo === 'rechazar') {
        modo = 'normal';
        const error = { codigo: 'DEMASIADOS_MENSAJES', mensaje: 'Esperá unos segundos' };
        ws.send(`43/chat,${envio[1]}${JSON.stringify([{ ok: false, error }])}`);
        return;
      }
      servidor.send(m);
    });
    servidor.onMessage((m) => {
      const respuesta = typeof m === 'string' && /^43\/chat,|"chat:mensaje"/.test(m);
      if (!(respuesta && modo === 'perder')) ws.send(m);
    });
  });
  const p = ana.page;
  await p.goto(`/viajes/${viajeId}/chat`);
  await tomas.page.goto(`/viajes/${viajeId}/chat`);
  await expect(p.getByText('Todavía no hay mensajes')).toBeVisible();

  modo = 'rechazar';
  await p.fill('#mensaje', 'Llevo el mate');
  await p.press('#mensaje', 'Enter');
  const burbuja = p.locator('.mensaje', { hasText: 'Llevo el mate' });
  await expect(burbuja).toContainText('No se pudo enviar');
  await burbuja.getByRole('button', { name: 'Reintentar' }).click();
  await expect(burbuja).toHaveAttribute('data-estado', 'enviado');
  await expect(tomas.page.locator('.mensaje', { hasText: 'Llevo el mate' })).toHaveCount(1);

  // El servidor lo guarda pero la respuesta no vuelve; al reconectarse queda enviado y sin aviso.
  modo = 'perder';
  await p.fill('#mensaje', 'Salgo en 5');
  await p.press('#mensaje', 'Enter');
  await expect(tomas.page.locator('.mensaje', { hasText: 'Salgo en 5' })).toHaveCount(1);
  await expect(p.locator('.mensaje', { hasText: 'Salgo en 5' })).toContainText(
    'No se pudo enviar',
    { timeout: 15_000 },
  );
  modo = 'normal';
  cortar();
  await expect(p.locator('.mensaje', { hasText: 'Salgo en 5' })).toHaveAttribute(
    'data-estado',
    'enviado',
    { timeout: 15_000 },
  );
  await expect(p.locator('.mensaje', { hasText: 'Salgo en 5' })).toHaveCount(1);
  await expect(p.getByRole('alert')).toHaveCount(0);
  await p.reload();
  await expect(p.locator('.mensaje')).toHaveCount(2);
});

test('RN-X8: el campo no deja mandar caracteres de control y explica por qué', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const viajeId = await viajeCon(ana);
  const p = ana.page;
  await p.goto(`/viajes/${viajeId}/chat`);
  await p.fill('#mensaje', 'hola\u0000chau');
  await expect(p.getByRole('alert')).toHaveText('Tiene caracteres que no se pueden usar');
  await expect(p.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  await p.press('#mensaje', 'Enter');
  await expect(p.locator('.mensaje')).toHaveCount(0);
});

test('un mensaje enviado mientras otra persona termina de entrar al chat le llega igual', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const tomas = await nuevoViajero(browser, 'Tomás');
  const viajeId = await viajeCon(ana, tomas);
  await ana.page.goto(`/viajes/${viajeId}/chat`);
  await expect(ana.page.getByText('Todavía no hay mensajes')).toBeVisible();
  // La unión de Tomás a la sala tarda en llegar al servidor.
  await tomas.page.routeWebSocket(/socket\.io/, (ws) => {
    const servidor = ws.connectToServer();
    ws.onMessage((m) => {
      if (typeof m === 'string' && m.includes('"chat:unirse"'))
        setTimeout(() => servidor.send(m), 1500);
      else servidor.send(m);
    });
    servidor.onMessage((m) => ws.send(m));
  });
  await tomas.page.goto(`/viajes/${viajeId}/chat`);
  // El mensaje sale cuando Tomás ya ve la pantalla del chat.
  await expect(tomas.page.getByText('Todavía no hay mensajes')).toBeVisible();
  await ana.page.fill('#mensaje', 'Justo ahora');
  await ana.page.press('#mensaje', 'Enter');
  await expect(tomas.page.locator('.mensaje', { hasText: 'Justo ahora' })).toHaveCount(1);
});
