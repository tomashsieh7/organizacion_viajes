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
});
