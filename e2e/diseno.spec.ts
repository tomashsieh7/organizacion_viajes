import { expect, nuevoViajero, test, viajeCon } from './soporte/fixtures.js';

test('En tamaño celular ninguna página del viaje se desborda a lo ancho', async ({ browser }) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const viajeId = await viajeCon(ana);
  const p = ana.page;
  await p.setViewportSize({ width: 360, height: 740 });
  const secciones = [
    'participantes',
    'alojamientos',
    'actividades',
    'cronograma',
    'mapa',
    'chat',
    'gastos',
    'saldos',
  ];
  for (const ruta of ['/viajes', ...secciones.map((s) => `/viajes/${viajeId}/${s}`)]) {
    await p.goto(ruta);
    await expect(p.locator('h1, h2').first()).toBeVisible();
    const desborde = await p.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(desborde, `desborde horizontal en ${ruta}`).toBe(0);
  }
});
