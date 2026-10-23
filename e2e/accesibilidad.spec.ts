import AxeBuilder from '@axe-core/playwright';
import { api, expect, nuevoViajero, test, viajeCon } from './soporte/fixtures.js';

/**
 * WCAG 2.2 AA con axe en las pantallas principales, con datos en cada una, con ancho de escritorio
 * y de celular, en modo claro y en oscuro (el que sigue al sistema). Un contraste bajo o un
 * control sin nombre hace fallar la prueba con el detalle de cada problema.
 */
test('Las pantallas principales no tienen problemas de accesibilidad que detecte axe', async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const ana = await nuevoViajero(browser, 'Ana');
  const tomas = await nuevoViajero(browser, 'Tomás');
  const v = await viajeCon(ana, tomas);
  await api(ana, 'POST', `/viajes/${v}/alojamientos`, {
    nombre: 'Cabaña del lago',
    descripcion: 'Para seis',
    ubicacion: 'Villa Los Coihues',
    fechaDesde: '2026-12-10',
    fechaHasta: '2026-12-16',
    precio: 18_500_000,
  });
  await api(ana, 'POST', `/viajes/${v}/actividades`, {
    titulo: 'Kayak',
    descripcion: 'Con guía',
    ubicacion: 'Bahía López',
    latitud: -41.08,
    longitud: -71.55,
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
    titulo: 'Cena',
    categoriaId: categorias[0]!.id,
    monto: 1_200_000,
    deudores: [ana.id, tomas.id],
    modoDivision: 'IGUALES',
  });

  const p = tomas.page;
  const rutas = [
    '/viajes',
    `/viajes/${v}/resumen`,
    `/viajes/${v}/participantes`,
    `/viajes/${v}/alojamientos`,
    `/viajes/${v}/alojamientos/nuevo`,
    `/viajes/${v}/actividades`,
    `/viajes/${v}/cronograma?dia=2026-12-11`,
    `/viajes/${v}/mapa?dia=2026-12-11`,
    `/viajes/${v}/chat`,
    `/viajes/${v}/gastos`,
    `/viajes/${v}/gastos/nuevo`,
    `/viajes/${v}/saldos`,
    `/viajes/${v}/saldos/pagar/${ana.id}`,
  ];
  const problemas: string[] = [];
  // Sin elección guardada, la app sigue al sistema: así se recorre también el modo oscuro.
  for (const [esquema, ancho] of [
    ['light', 1280],
    ['dark', 360],
    ['dark', 1280],
  ] as const) {
    await p.emulateMedia({ colorScheme: esquema });
    await p.setViewportSize({ width: ancho, height: 800 });
    for (const ruta of rutas) {
      await p.goto(ruta);
      await expect(p.locator('h1, h2').first()).toBeVisible();
      const { violations } = await new AxeBuilder({ page: p })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      for (const v of violations) {
        const donde = v.nodes.map((n) => n.target.join(' ')).join(', ');
        problemas.push(`${ruta} (${esquema}, ${ancho} px): ${v.id} en ${donde}`);
      }
    }
  }
  expect(problemas).toEqual([]);
});
