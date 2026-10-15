import { ORIGEN_WEB } from './soporte/constantes.js';
import { api, expect, nuevoViajero, test, viajeCon, type Viajero } from './soporte/fixtures.js';

/**
 * Robustez de la API ante datos raros: ningún pedido inválido tiene que terminar en un error del
 * servidor (5xx). Cada respuesta tiene que ser un 2xx o un 4xx con su código de error.
 */
async function pedir(v: Viajero, metodo: string, ruta: string, datos?: unknown) {
  const r = await v.page.request.fetch(`/api${ruta}`, {
    method: metodo,
    headers: { Origin: ORIGEN_WEB },
    ...(datos !== undefined ? { data: datos } : {}),
  });
  return { ruta: `${metodo} ${ruta}`, estado: r.status() };
}

const NADA = '00000000-0000-4000-8000-000000000000';

test('la API responde 4xx, nunca 5xx, ante datos inválidos', async ({ browser }) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const tomas = await nuevoViajero(browser, 'Tomás');
  const v = await viajeCon(ana, tomas);
  const viaje = {
    nombre: 'X',
    destino: 'Y',
    fechaInicio: '2026-12-10',
    fechaFin: '2026-12-16',
    monedaCodigo: 'ARS',
  };
  const alojamiento = {
    nombre: 'H',
    descripcion: 'd',
    ubicacion: 'u',
    fechaDesde: '2026-12-10',
    fechaHasta: '2026-12-12',
  };
  const actividad = {
    titulo: 'A',
    descripcion: 'd',
    ubicacion: 'u',
    latitud: 0,
    longitud: 0,
    fecha: '2026-12-11',
    horaInicio: '10:00',
    duracionMin: 60,
  };
  const { categorias } = await api<{ categorias: { id: string }[] }>(
    ana,
    'GET',
    '/categorias-gasto',
  );
  const gasto = {
    titulo: 'G',
    categoriaId: categorias[0]!.id,
    monto: 1000,
    deudores: [ana.id, tomas.id],
    modoDivision: 'IGUALES',
  };

  const casos: [string, string, unknown?][] = [
    ['POST', '/viajes', { ...viaje, fechaInicio: '2026-12-20' }],
    ['POST', '/viajes', { ...viaje, fechaInicio: '2026-02-30' }],
    ['POST', '/viajes', { ...viaje, nombre: 'n'.repeat(1000) }],
    ['POST', '/viajes', { ...viaje, monedaCodigo: 'XXX' }],
    ['POST', '/viajes', {}],
    ['POST', '/viajes', 'texto'],
    ['GET', `/viajes/${NADA}`],
    ['GET', '/viajes/no-es-uuid'],
    ['GET', '/viajes/no-es-uuid/gastos'],
    ['POST', `/viajes/${v}/participantes`, { email: 'no-es-email' }],
    ['POST', `/viajes/${v}/participantes`, { email: ana.email }],
    ['POST', `/viajes/${v}/participantes`, { email: 'nadie@nadie.com' }],
    ['POST', `/viajes/${v}/alojamientos`, { ...alojamiento, fechaDesde: '2026-11-01' }],
    ['POST', `/viajes/${v}/alojamientos`, { ...alojamiento, fechaHasta: '2026-12-09' }],
    ['POST', `/viajes/${v}/alojamientos`, { ...alojamiento, precio: -5 }],
    ['POST', `/viajes/${v}/alojamientos`, { ...alojamiento, precio: 'mil' }],
    ['POST', `/viajes/${v}/alojamientos`, { ...alojamiento, precio: 1e300 }],
    ['POST', `/viajes/${v}/alojamientos`, { ...alojamiento, latitud: 10 }],
    ['POST', `/viajes/${v}/actividades`, { ...actividad, horaInicio: '25:00' }],
    ['POST', `/viajes/${v}/actividades`, { ...actividad, duracionMin: 0 }],
    ['POST', `/viajes/${v}/actividades`, { ...actividad, duracionMin: 1441 }],
    ['POST', `/viajes/${v}/actividades`, { ...actividad, fecha: '2027-01-01' }],
    ['PUT', `/viajes/${v}/propuestas/${NADA}/voto`, { valor: 'A_FAVOR' }],
    ['PUT', `/viajes/${v}/propuestas/no-es-uuid/voto`, { valor: 'TAL_VEZ' }],
    ['POST', `/viajes/${v}/propuestas/${NADA}/confirmar`],
    ['DELETE', `/viajes/${v}/propuestas/${NADA}/voto`],
    ['GET', `/viajes/${v}/mapa?hoy=2026-10-15&dia=2027-01-01`],
    ['GET', `/viajes/${v}/mapa?hoy=basura`],
    ['GET', `/viajes/${v}/mensajes?limite=1000`],
    ['GET', `/viajes/${v}/mensajes?antesDe=${NADA}`],
    ['GET', `/viajes/${v}/mensajes?antesDe=basura`],
    ['GET', `/viajes/${v}/deudas`],
    ['GET', `/viajes/${v}/alojamientos?estado=RARO`],
    ['POST', `/viajes/${v}/pagos`, { acreedorId: tomas.id, monto: 100 }],
    ['POST', `/viajes/${v}/pagos`, { acreedorId: ana.id, monto: 100 }],
    ['POST', `/viajes/${v}/pagos`, { acreedorId: tomas.id, monto: 0 }],
    ['POST', `/viajes/${v}/administracion/traspaso`, { nuevoAdminId: NADA }],
    ['DELETE', `/viajes/${v}/participantes/${ana.id}`],
    ['DELETE', `/viajes/${v}/participantes/${NADA}`],
    ['POST', `/viajes/${v}/gastos`, { ...gasto, monto: 0 }],
    ['POST', `/viajes/${v}/gastos`, { ...gasto, monto: 10.5 }],
    ['POST', `/viajes/${v}/gastos`, { ...gasto, monto: 1e20 }],
    ['POST', `/viajes/${v}/gastos`, { ...gasto, deudores: [] }],
    ['POST', `/viajes/${v}/gastos`, { ...gasto, deudores: [ana.id, ana.id] }],
    ['POST', `/viajes/${v}/gastos`, { ...gasto, deudores: [NADA] }],
    ['POST', `/viajes/${v}/gastos`, { ...gasto, pagadoPorId: NADA }],
    ['POST', `/viajes/${v}/gastos`, { ...gasto, categoriaId: NADA }],
    ['POST', `/viajes/${v}/gastos`, { ...gasto, modoDivision: 'ARBITRARIA' }],
    [
      'POST',
      `/viajes/${v}/gastos`,
      { ...gasto, modoDivision: 'ARBITRARIA', partes: [{ usuarioId: ana.id, monto: 1 }] },
    ],
  ];
  const respuestas = [];
  for (const [metodo, ruta, datos] of casos) respuestas.push(await pedir(ana, metodo, ruta, datos));
  expect(respuestas.filter((r) => r.estado >= 500)).toEqual([]);
  expect(respuestas.filter((r) => r.estado < 400).map((r) => r.ruta)).toEqual([]);

  // Sin el encabezado Origin, se rechaza (RN-S6).
  const sinOrigen = await ana.page.request.fetch('/api/viajes', { method: 'POST', data: viaje });
  expect(sinOrigen.status()).toBe(403);
  // Alguien ajeno al viaje no ve sus datos.
  const luis = await nuevoViajero(browser, 'Luis');
  const ajeno = await pedir(luis, 'GET', `/viajes/${v}/gastos`);
  expect([403, 404]).toContain(ajeno.estado);
});

test('RN-P3: pagos simultáneos no superan la deuda', async ({ browser }) => {
  const ana = await nuevoViajero(browser, 'Ana');
  const tomas = await nuevoViajero(browser, 'Tomás');
  const v = await viajeCon(ana, tomas);
  const { categorias } = await api<{ categorias: { id: string }[] }>(
    ana,
    'GET',
    '/categorias-gasto',
  );
  // Tomás paga 1000 entre los dos: Ana le debe 500.
  await api(tomas, 'POST', `/viajes/${v}/gastos`, {
    titulo: 'Cena',
    categoriaId: categorias[0]!.id,
    monto: 1000,
    deudores: [ana.id, tomas.id],
    modoDivision: 'IGUALES',
  });
  const pagos = await Promise.all(
    [1, 2, 3].map(() =>
      pedir(ana, 'POST', `/viajes/${v}/pagos`, { acreedorId: tomas.id, monto: 500 }),
    ),
  );
  // Uno se registra; los otros se rechazan con un 4xx, porque ya no queda deuda.
  expect(pagos.filter((p) => p.estado === 201)).toHaveLength(1);
  expect(pagos.filter((p) => p.estado >= 400 && p.estado < 500)).toHaveLength(2);
});
