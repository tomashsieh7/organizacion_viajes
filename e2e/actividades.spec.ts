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
  await expect(aviso).toContainText('Kayak, 11/12/2026 · 10:00 a 12:00');
  // El formulario conserva lo cargado; solo se ajusta la hora.
  await expect(p.locator('#actividad-titulo')).toHaveValue('Trekking al cerro');
  await p.fill('#actividad-hora', '12:00');
  await p.getByRole('button', { name: 'Proponer' }).click();

  await expect(p).toHaveURL(new RegExp(`/viajes/${viajeId}/actividades$`));
  const tarjeta = p.locator('article', { hasText: 'Trekking al cerro' });
  await expect(tarjeta).toContainText('Pendiente');
  await expect(tarjeta).toContainText('12:00 a 13:30');
});
