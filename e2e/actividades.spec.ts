import { api, expect, nuevoViajero, test, viajeCon } from './soporte/fixtures.js';

test('CU10 y RN-A2: proponer una actividad que se superpone, ajustar el horario y guardarla', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const tomas = await nuevoViajero(browser, 'Tomás');
  const viajeId = await viajeCon(ana, tomas);
  // Ya hay una actividad confirmada de 10:00 a 12:00.
  const { actividad } = await api<{ actividad: { id: string } }>(
    ana,
    'POST',
    `/viajes/${viajeId}/actividades`,
    {
      titulo: 'Kayak',
      descripcion: 'Salida guiada',
      ubicacion: 'Bahía López',
      latitud: -41.08,
      longitud: -71.55,
      fecha: '2026-12-11',
      horaInicio: '10:00',
      duracionMin: 120,
    },
  );
  await api(ana, 'POST', `/viajes/${viajeId}/propuestas/${actividad.id}/confirmar`);

  const p = tomas.page;
  await p.goto(`/viajes/${viajeId}/actividades/nueva`);
  await p.fill('#actividad-titulo', 'Trekking al cerro');
  await p.fill('#actividad-descripcion', 'Subida al Campanario');
  await p.fill('#actividad-fecha', '2026-12-11');
  await p.fill('#actividad-hora', '11:00');
  await p.fill('#actividad-duracion', '90');
  await p.fill('#ubicacion', 'Bahía');
  await p.getByRole('option', { name: 'Bahía López, Bariloche' }).click();
  await expect(p.getByText('Punto marcado en el mapa.')).toBeVisible();
  await p.getByRole('button', { name: 'Proponer' }).click();

  const aviso = p.locator('.aviso-superposicion');
  await expect(aviso).toContainText('Kayak, 11 dic 2026 · 10:00 a 12:00');
  // El formulario conserva lo cargado; solo se ajusta la hora.
  await expect(p.locator('#actividad-titulo')).toHaveValue('Trekking al cerro');
  await p.fill('#actividad-hora', '12:00');
  await p.getByRole('button', { name: 'Proponer' }).click();

  await expect(p).toHaveURL(new RegExp(`/viajes/${viajeId}/actividades$`));
  const tarjeta = p.locator('article', { hasText: 'Trekking al cerro' });
  await expect(tarjeta).toContainText('Pendiente');
  await expect(tarjeta).toContainText('12:00 a 13:30');
});

test('CU10: si la respuesta de proponer se pierde y se reintenta, queda una sola actividad', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const viajeId = await viajeCon(ana);
  const p = ana.page;
  let primera = true;
  // El servidor guarda la actividad, pero la respuesta no llega, como con mala señal.
  await p.route('**/actividades', async (r) => {
    if (r.request().method() !== 'POST' || !primera) return r.continue();
    primera = false;
    await r.fetch();
    await r.abort('connectionreset');
  });
  await p.goto(`/viajes/${viajeId}/actividades/nueva`);
  await p.fill('#actividad-titulo', 'Con mala señal');
  await p.fill('#actividad-descripcion', 'Con guía');
  await p.fill('#ubicacion', 'Bahía');
  await p.getByRole('option').first().click();
  await p.fill('#actividad-fecha', '2026-12-11');
  await p.fill('#actividad-hora', '15:00');
  await p.fill('#actividad-duracion', '90');
  await p.getByRole('button', { name: /Proponer/ }).click();
  await expect(p.getByText('No se pudo contactar al servidor')).toBeVisible();
  await p.getByRole('button', { name: /Proponer/ }).click();
  await expect(p).toHaveURL(/\/actividades$/);

  const { actividades } = await api<{ actividades: { actividad: { titulo: string } }[] }>(
    ana,
    'GET',
    `/viajes/${viajeId}/actividades`,
  );
  expect(actividades.filter((a) => a.actividad.titulo === 'Con mala señal')).toHaveLength(1);
});

test('RN-R4: votar una opción que se denegó con la lista abierta muestra cómo quedó', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const beto = await nuevoViajero(browser, 'Beto');
  const viajeId = await viajeCon(ana, beto);
  const base = {
    titulo: 'Kayak',
    descripcion: 'Remar',
    ubicacion: 'Lago',
    latitud: -41.1,
    longitud: -71.3,
    fecha: '2026-12-11',
    horaInicio: '10:00',
    duracionMin: 60,
  };
  const { actividad } = await api<{ actividad: { id: string } }>(
    beto,
    'POST',
    `/viajes/${viajeId}/actividades`,
    base,
  );
  await api(beto, 'POST', `/viajes/${viajeId}/actividades/${actividad.id}/alternativas`, {
    ...base,
    titulo: 'Cerro Catedral',
    horaInicio: '14:00',
  });
  await beto.page.goto(`/viajes/${viajeId}/actividades`);
  const catedral = beto.page.locator('article', { hasText: 'Cerro Catedral' });
  await expect(catedral.getByRole('button', { name: 'A favor' })).toBeVisible();

  // Ana confirma la original, que deniega la alternativa, mientras Beto mira la lista.
  await api(ana, 'POST', `/viajes/${viajeId}/propuestas/${actividad.id}/confirmar`);
  await catedral.getByRole('button', { name: 'A favor' }).click();
  await expect(beto.page.getByRole('alert')).toContainText('ya fue resuelta');
  await expect(catedral).toContainText('Denegada');
  await expect(catedral.getByRole('button', { name: 'A favor' })).toHaveCount(0);
});
