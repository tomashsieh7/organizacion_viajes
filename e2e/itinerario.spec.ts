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
