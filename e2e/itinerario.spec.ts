import { api, expect, nuevoViajero, test, viajeCon } from './soporte/fixtures.js';

test('CU13 y CU16 a CU18: confirmar una actividad y verla en el cronograma y en el mapa', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const tomas = await nuevoViajero(browser, 'Tomás');
  const viajeId = await viajeCon(ana, tomas);
  await api(tomas, 'POST', `/viajes/${viajeId}/actividades`, {
    titulo: 'Cerro Catedral',
    descripcion: 'Aerosilla y caminata',
    ubicacion: 'Base del cerro',
    latitud: -41.17,
    longitud: -71.44,
    fecha: '2026-12-12',
    horaInicio: '09:30',
    duracionMin: 240,
  });

  const p = ana.page;
  await p.goto(`/viajes/${viajeId}/actividades`);
  const tarjeta = p.locator('article', { hasText: 'Cerro Catedral' });
  await tarjeta.getByRole('button', { name: 'Confirmar' }).click();
  await expect(tarjeta).toContainText('Confirmada');
  // Confirmar se celebra con el nombre de la actividad.
  await expect(p.getByText('¡Confirmaron Cerro Catedral!')).toBeVisible();

  // El grupo Itinerario abre su primera sección, el cronograma, en el primer día con actividades.
  await p.getByRole('link', { name: 'Itinerario' }).click();
  await expect(p.getByRole('link', { name: 'Cronograma' })).toHaveAttribute('aria-current', 'page');
  const dia = p.locator('#dia-2026-12-12');
  await expect(dia).toContainText('09:30 a 13:30');
  await expect(dia).toContainText('Cerro Catedral');
  await p.getByRole('button', { name: /^viernes 11 dic/ }).click();
  await expect(p.locator('#dia-2026-12-11')).toContainText('Sin actividades confirmadas');

  // El día elegido se conserva al pasar al mapa.
  await p.getByRole('link', { name: 'Mapa', exact: true }).click();
  await expect(p).toHaveURL(/\/mapa\?dia=2026-12-11$/);
  await expect(p.getByRole('button', { name: /^viernes 11 dic/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    p.getByRole('status').filter({ hasText: 'no tiene actividades confirmadas' }),
  ).toBeVisible();

  // "Ver en el mapa" abre el día de la actividad con su detalle.
  await p.getByRole('link', { name: 'Cronograma', exact: true }).click();
  await p.getByRole('button', { name: /^sábado 12 dic/ }).click();
  await dia.getByRole('link', { name: 'Ver en el mapa' }).click();
  await expect(p).toHaveURL(/\/mapa\?actividad=/);
  await expect(p.getByRole('button', { name: /^sábado 12 dic/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(p.locator('.marcador-actividad')).toHaveText('1');
  await expect(p.locator('.panel-actividad')).toContainText('Cerro Catedral');
  await expect(p.locator('.panel-actividad')).toContainText('Base del cerro');
});

test('RN-C2: una actividad que pasa la medianoche se aclara y aparece también al día siguiente', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const viajeId = await viajeCon(ana);
  const { actividad } = await api<{ actividad: { id: string } }>(
    ana,
    'POST',
    `/viajes/${viajeId}/actividades`,
    {
      titulo: 'Noche de bar',
      descripcion: 'Salida',
      ubicacion: 'Centro',
      latitud: -41.13,
      longitud: -71.31,
      fecha: '2026-12-11',
      horaInicio: '22:00',
      duracionMin: 180,
    },
  );
  await api(ana, 'POST', `/viajes/${viajeId}/propuestas/${actividad.id}/confirmar`);
  const p = ana.page;

  await p.goto(`/viajes/${viajeId}/cronograma?dia=2026-12-11`);
  await expect(p.getByText('22:00 a 01:00 del día siguiente')).toBeVisible();

  await p.goto(`/viajes/${viajeId}/cronograma?dia=2026-12-12`);
  const sigue = p.locator('li', { hasText: 'sigue del día anterior' });
  await expect(sigue).toContainText('Hasta 01:00');
  await expect(sigue).toContainText('Noche de bar');
  await expect(p.getByText('Sin actividades confirmadas')).toHaveCount(0);

  // RN-M9: el mapa del día siguiente también la muestra, sin el aviso de día vacío, y la abre.
  await p.goto(`/viajes/${viajeId}/mapa?dia=2026-12-12`);
  const sigueEnMapa = p.locator('.siguen li');
  await expect(sigueEnMapa).toContainText('Hasta 01:00 · Noche de bar');
  await expect(p.getByText('no tiene actividades confirmadas')).toHaveCount(0);
  await sigueEnMapa.getByRole('button', { name: 'Ver en el mapa' }).click();
  await expect(p).toHaveURL(new RegExp(`actividad=${actividad.id}&dia=2026-12-11$`));
  await expect(p.locator('.panel-actividad')).toContainText('22:00 a 01:00 del día siguiente');
});

test('mapa: mismo lugar, teclado, títulos largos y actividad no confirmada', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const viajeId = await viajeCon(ana);
  const proponer = async (titulo: string, horaInicio: string, latitud: number) =>
    (
      await api<{ actividad: { id: string } }>(ana, 'POST', `/viajes/${viajeId}/actividades`, {
        titulo,
        descripcion: 'x',
        ubicacion: 'Hotel',
        latitud,
        longitud: -71.3,
        fecha: '2026-12-11',
        horaInicio,
        duracionMin: 60,
      })
    ).actividad.id;
  const largo = 'Desayuno en el hotel con todo el grupo antes de salir a la excursión';
  for (const [titulo, hora] of [
    [largo, '08:00'],
    ['Cena en el hotel', '21:00'],
  ] as const) {
    const id = await proponer(titulo, hora, -41.1);
    await api(ana, 'POST', `/viajes/${viajeId}/propuestas/${id}/confirmar`);
  }
  const pendiente = await proponer('Pendiente', '15:00', -41.3);
  const p = ana.page;
  await p.setViewportSize({ width: 360, height: 740 });
  await p.goto(`/viajes/${viajeId}/mapa?dia=2026-12-11`);

  // Las dos actividades del hotel se ven separadas, con sus dos números.
  const marcadores = p.locator('.marcador-actividad');
  await expect(marcadores).toHaveText(['1', '2']);
  const [x1, x2] = await marcadores.evaluateAll((m) => m.map((e) => e.getBoundingClientRect().x));
  expect(Math.abs(x1! - x2!)).toBeGreaterThanOrEqual(20);

  // Los títulos largos de la lista quedan alineados a la izquierda.
  await expect(p.locator('.orden button').first()).toHaveCSS('text-align', 'left');

  await marcadores.nth(1).focus();
  await p.keyboard.press('Enter');
  await expect(p.locator('.panel-actividad h3')).toContainText('Cena en el hotel');

  await p.goto(`/viajes/${viajeId}/mapa?actividad=${pendiente}`);
  await expect(p.locator('.marcador-actividad--fuera')).toHaveCount(1);
  await expect(p.locator('.marcador-actividad--fuera')).toHaveAttribute(
    'title',
    'Pendiente (no confirmada)',
  );
  await expect(p.locator('.panel-actividad')).toContainText('el marcador gris muestra dónde es');
});
