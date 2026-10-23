import { api, expect, nuevoViajero, test, viajeCon } from './soporte/fixtures.js';

test('En tamaño celular ninguna página del viaje se desborda a lo ancho', async ({ browser }) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const viajeId = await viajeCon(ana);
  const p = ana.page;
  await p.setViewportSize({ width: 360, height: 740 });
  const secciones = [
    'resumen',
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

test('Con nombres, títulos y montos largos tampoco se desborda nada en celular', async ({
  browser,
}) => {
  // Un nombre sin espacios, como un link pegado, y otro largo con espacios.
  const ana = await nuevoViajero(browser, 'Maximiliana' + 'x'.repeat(69));
  const tomas = await nuevoViajero(browser, 'Juan Bautista Rodríguez Larreta del Valle Grande');
  const { viaje } = await api<{ viaje: { id: string } }>(ana, 'POST', '/viajes', {
    nombre: 'Viaje de egresados a Bariloche con los chicos del colegio nacional',
    destino: 'San Carlos de Bariloche, Argentina',
    fechaInicio: '2026-12-10',
    fechaFin: '2026-12-16',
    monedaCodigo: 'ARS',
  });
  const v = viaje.id;
  await api(ana, 'POST', `/viajes/${v}/participantes`, { email: tomas.email });
  const titulo = (inicio: string) => (inicio + ' ' + 'palabra '.repeat(20)).slice(0, 120);
  const propuesta = {
    descripcion: 'Para seis personas con desayuno incluido. '.repeat(20),
    ubicacion: 'Avenida Exequiel Bustillo kilómetro 24,5, Villa Llao Llao, San Carlos de Bariloche',
    latitud: -41.05,
    longitud: -71.53,
  };
  await api(ana, 'POST', `/viajes/${v}/alojamientos`, {
    ...propuesta,
    nombre: titulo('Hostería'),
    fechaDesde: '2026-12-10',
    fechaHasta: '2026-12-16',
    precio: 185_000_000,
  });
  await api(ana, 'POST', `/viajes/${v}/actividades`, {
    ...propuesta,
    titulo: 'Kayak' + 'k'.repeat(115),
    fecha: '2026-12-11',
    horaInicio: '10:00',
    duracionMin: 120,
  });
  const { categorias } = await api<{ categorias: { id: string }[] }>(
    ana,
    'GET',
    '/categorias-gasto',
  );
  await api(ana, 'POST', `/viajes/${v}/gastos`, {
    titulo: titulo('Supermercado'),
    categoriaId: categorias[0]!.id,
    monto: 2_469_135_780,
    deudores: [ana.id, tomas.id],
    modoDivision: 'IGUALES',
  });
  await api(tomas, 'POST', `/viajes/${v}/pagos`, { acreedorId: ana.id, monto: 123_456_789 });

  const p = tomas.page;
  await p.setViewportSize({ width: 360, height: 740 });
  const rutas = [
    'resumen',
    'participantes',
    'alojamientos',
    'actividades',
    'cronograma?dia=2026-12-11',
    'chat',
    'gastos',
    'gastos/nuevo',
    'saldos',
    'saldos?ver=meDeben',
    `saldos/pagar/${ana.id}`,
  ];
  for (const ruta of ['/viajes', ...rutas.map((r) => `/viajes/${v}/${r}`)]) {
    await p.goto(ruta);
    await expect(p.locator('h1, h2').first()).toBeVisible();
    const desborde = await p.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(desborde, `desborde horizontal en ${ruta}`).toBe(0);
  }

  // Junto al nombre largo del grupo, la etiqueta «Admin» queda en una línea, sin partirse.
  await ana.page.setViewportSize({ width: 360, height: 740 });
  await ana.page.goto('/viajes');
  const etiqueta = ana.page.locator('.etiqueta', { hasText: 'Admin' }).first();
  expect((await etiqueta.boundingBox())!.height).toBeLessThan(30);
});

test('El modo de color sigue al sistema hasta que se elige otro, y se recuerda al volver', async ({
  page,
}) => {
  const fondo = () =>
    page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  const tema = () => page.evaluate(() => document.documentElement.dataset['tema']);
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/ingresar');
  expect(await tema()).toBe('oscuro');
  expect(await fondo()).toBe('rgb(31, 31, 31)');

  await page.getByRole('button', { name: 'Modo: Automático' }).click();
  await page.getByRole('button', { name: 'Claro', exact: true }).click();
  expect(await tema()).toBe('claro');
  expect(await fondo()).toBe('rgb(250, 246, 238)');

  // Lo elegido gana sobre el sistema y ya está aplicado antes de que cargue la app.
  await page.route('**/src/main.ts', (r) => r.abort());
  await page.reload();
  expect(await tema()).toBe('claro');
  expect(await fondo()).toBe('rgb(250, 246, 238)');
  await page.unroute('**/src/main.ts');

  await page.reload();
  await page.getByRole('button', { name: 'Modo: Claro' }).click();
  await page.getByRole('button', { name: 'Automático', exact: true }).click();
  expect(await tema()).toBe('oscuro');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect.poll(tema).toBe('claro');
});
