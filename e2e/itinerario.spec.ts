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

  await p.getByRole('link', { name: 'Cronograma' }).click();
  const dia = p.locator('#dia-2026-12-12');
  await expect(dia).toContainText('09:30 a 13:30');
  await expect(dia).toContainText('Cerro Catedral');
  await expect(p.locator('#dia-2026-12-11')).toContainText('Sin actividades confirmadas');

  await dia.getByRole('link', { name: 'Ver en el mapa' }).click();
  await expect(p).toHaveURL(/\/mapa\?actividad=/);
  await expect(p.locator('.selector-dia [aria-pressed="true"]')).toContainText('12/12');
  await expect(p.locator('.marcador-actividad')).toHaveText('1');
  await expect(p.locator('.panel-actividad')).toContainText('Cerro Catedral');
  await expect(p.locator('.panel-actividad')).toContainText('Base del cerro');

  // Otro día sin actividades muestra el aviso.
  await p.locator('.selector-dia button', { hasText: '13/12' }).click();
  await expect(p.getByRole('status')).toContainText('no tiene actividades confirmadas');
});
