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

test('Con nombres, títulos y montos largos no se desborda nada, en celular ni en escritorio', async ({
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
  // Celular, tablet, el borde donde aparece la barra lateral y un escritorio común.
  for (const ancho of [360, 900, 1024, 1280]) {
    await p.setViewportSize({ width: ancho, height: 740 });
    for (const ruta of ['/viajes', ...rutas.map((r) => `/viajes/${v}/${r}`)]) {
      await p.goto(ruta);
      await expect(p.locator('h1, h2').first()).toBeVisible();
      const desborde = await p.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(desborde, `desborde horizontal en ${ruta} a ${ancho} px`).toBe(0);
    }
  }

  // Junto al nombre largo del grupo, la etiqueta «Admin» queda en una línea, sin partirse.
  await ana.page.setViewportSize({ width: 360, height: 740 });
  await ana.page.goto('/viajes');
  const etiqueta = ana.page.locator('.etiqueta', { hasText: 'Admin' }).first();
  expect((await etiqueta.boundingBox())!.height).toBeLessThan(30);
});

test('Con cantidades de dos cifras, el filtro de estados se ve entero en un celular angosto', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const v = await viajeCon(ana);
  for (let i = 0; i < 12; i++) {
    await api(ana, 'POST', `/viajes/${v}/alojamientos`, {
      nombre: `Cabaña ${i + 1}`,
      descripcion: 'Con desayuno',
      ubicacion: 'Centro',
      fechaDesde: '2026-12-10',
      fechaHasta: '2026-12-12',
      precio: 5_000_000,
    });
  }
  const p = ana.page;
  await p.setViewportSize({ width: 360, height: 740 });
  await p.goto(`/viajes/${v}/alojamientos`);
  const botones = p.locator('.filtro button');
  await expect(botones.first()).toContainText('12');
  // Si no entran en un renglón pasan a dos: ningún botón queda cortado ni hay que deslizar.
  for (const caja of await botones.evaluateAll((bs) =>
    bs.map((b) => {
      const r = b.getBoundingClientRect();
      return { izquierda: r.left, derecha: r.right };
    }),
  )) {
    expect(caja.izquierda).toBeGreaterThanOrEqual(0);
    expect(caja.derecha).toBeLessThanOrEqual(360);
  }
  const fila = p.locator('.filtro');
  expect(await fila.evaluate((f) => f.scrollWidth - f.clientWidth)).toBe(0);
});

test('En escritorio el calendario va a la derecha, y en Actividades el filtro va arriba a todo el ancho', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const v = await viajeCon(ana);
  const { actividad } = await api<{ actividad: { id: string } }>(
    ana,
    'POST',
    `/viajes/${v}/actividades`,
    {
      titulo: 'Kayak',
      descripcion: 'Remar',
      ubicacion: 'Lago',
      latitud: -41.1,
      longitud: -71.3,
      fecha: '2026-12-11',
      horaInicio: '10:00',
      duracionMin: 60,
    },
  );
  await api(ana, 'POST', `/viajes/${v}/propuestas/${actividad.id}/confirmar`);
  const p = ana.page;
  const caja = async (selector: string) => (await p.locator(selector).first().boundingBox())!;
  await p.setViewportSize({ width: 1280, height: 800 });
  for (const [ruta, contenido] of [
    ['actividades', '.renglones'],
    ['cronograma', '.calendario + *'],
    ['mapa', '.mapa-dia__mapa'],
  ] as const) {
    await p.goto(`/viajes/${v}/${ruta}?dia=2026-12-11`);
    await expect(p.locator(contenido).first()).toBeVisible();
    const calendario = await caja('.calendario');
    expect(calendario.x, `calendario a la derecha en ${ruta}`).toBeGreaterThan(
      (await caja(contenido)).x + (await caja(contenido)).width - 1,
    );
  }
  await p.goto(`/viajes/${v}/actividades?dia=2026-12-11`);
  const filtro = await caja('.filtro');
  const calendario = await caja('.calendario');
  // El filtro va por encima del calendario y entra en un renglón con los nombres completos.
  expect(filtro.y + filtro.height).toBeLessThanOrEqual(calendario.y);
  expect(filtro.height).toBeLessThan(60);
  // En celular, el calendario arriba y el filtro justo encima de la lista.
  await p.setViewportSize({ width: 360, height: 740 });
  const cel = {
    calendario: await caja('.calendario'),
    filtro: await caja('.filtro'),
    lista: await caja('.renglones'),
  };
  expect(cel.calendario.y).toBeLessThan(cel.filtro.y);
  expect(cel.filtro.y).toBeLessThan(cel.lista.y);
});

test('En el chat del celular, la página no deja bajar más allá del campo para escribir', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const v = await viajeCon(ana);
  const p = ana.page;
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(`/viajes/${v}/chat`);
  // Lo que queda por debajo del campo para escribir (el lugar de la barra de navegación).
  const sobrante = () =>
    p.evaluate(() => {
      const campo = document.querySelector('#mensaje')!.closest('form')!.getBoundingClientRect();
      return Math.round(document.documentElement.scrollHeight - (campo.bottom + window.scrollY));
    });
  const enviar = async (i: number) => {
    await p.fill(
      '#mensaje',
      `Mensaje ${i}: ${'un texto largo que ocupa varios renglones '.repeat(3)}`,
    );
    await p.press('#mensaje', 'Enter');
    await expect(p.locator('.mensaje')).toHaveCount(i);
  };
  await enviar(1);
  const conUno = await sobrante();
  // Mensajes largos y propios: cada uno lleva el nombre solo para lectores de pantalla, que no
  // tiene que estirar la página aunque la lista de mensajes se desplace.
  for (let i = 2; i <= 10; i++) await enviar(i);
  expect(await sobrante()).toBe(conUno);
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

test('En escritorio el viaje y el menú van en una barra lateral que queda fija al bajar', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const v = await viajeCon(ana);
  const p = ana.page;
  const barra = p.locator('header.viaje');
  const seccion = p.locator('#seccion');

  // Desde 1024 px, la barra está a la izquierda de la sección y el menú es vertical.
  await p.setViewportSize({ width: 1024, height: 700 });
  await p.goto(`/viajes/${v}/cronograma`);
  await expect(p.getByRole('heading', { name: 'Cronograma' })).toBeVisible();
  const b = (await barra.boundingBox())!;
  const s = (await seccion.boundingBox())!;
  expect(b.x + b.width).toBeLessThanOrEqual(s.x);
  const grupos = p.locator('nav.grupos a');
  const [inicio, planificar] = [
    (await grupos.nth(0).boundingBox())!,
    (await grupos.nth(1).boundingBox())!,
  ];
  expect(planificar.y).toBeGreaterThan(inicio.y);
  expect(planificar.x).toBe(inicio.x);

  // Con la página corrida hacia abajo, el nombre del viaje sigue a la vista.
  await p.evaluate(() => {
    document.getElementById('seccion')!.style.minHeight = '3000px';
    window.scrollTo(0, 1500);
  });
  await expect(p.getByRole('heading', { name: 'Bariloche 2026' })).toBeInViewport();

  // Por debajo de 1024 px vuelve la portada arriba, con las secciones en pestañas.
  await p.setViewportSize({ width: 1000, height: 700 });
  await p.goto(`/viajes/${v}/cronograma`);
  await expect(p.getByRole('heading', { name: 'Cronograma' })).toBeVisible();
  expect((await barra.boundingBox())!.y + (await barra.boundingBox())!.height).toBeLessThanOrEqual(
    (await seccion.boundingBox())!.y,
  );
});

test('En celular, los controles del mapa no quedan por encima de la barra de navegación', async ({
  browser,
}) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const v = await viajeCon(ana);
  const p = ana.page;
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(`/viajes/${v}/alojamientos/nuevo`);
  const zoom = p.locator('.leaflet-control-zoom-in');
  await expect(zoom).toBeVisible();
  // Se baja hasta que el botón «+» del mapa quede a la altura de la barra de navegación.
  const resultado = await p.evaluate(() => {
    const centro = (r: DOMRect) => r.top + r.height / 2;
    const nav = document.querySelector('nav.grupos')!;
    const boton = document.querySelector('.leaflet-control-zoom-in')!;
    window.scrollBy(0, centro(boton.getBoundingClientRect()) - centro(nav.getBoundingClientRect()));
    const b = boton.getBoundingClientRect();
    const y = centro(nav.getBoundingClientRect());
    return {
      alineado: b.top < y && y < b.bottom,
      arriba: document.elementFromPoint(b.left + b.width / 2, y)?.closest('nav.grupos')
        ? 'barra'
        : 'mapa',
    };
  });
  expect(resultado.alineado).toBe(true);
  expect(resultado.arriba).toBe('barra');
});
