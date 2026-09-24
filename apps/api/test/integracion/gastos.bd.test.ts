import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DeudaVista } from '@viajes/compartido';
import { cargarCatalogos } from '../../prisma/semilla.js';
import { crearApp } from '../../src/app.js';
import { vaciarBase } from '../soporte/baseDePrueba.js';
import { crearApiDePrueba, registrar, type Cliente } from '../soporte/apiDePrueba.js';
import { verificarInvarianteDeSaldos } from '../soporte/invarianteSaldos.js';

const { contenedor } = crearApiDePrueba();
const db = contenedor.prisma;
let app = crearApp(contenedor);
afterAll(() => db.$disconnect());

let ana: { c: Cliente; id: string };
let tomas: { c: Cliente; id: string };
let luis: { c: Cliente; id: string };
let viajeId: string;
let comida: string;
const url = (s = '') => `/api/viajes/${viajeId}${s}`;

beforeEach(async () => {
  app = crearApp(contenedor);
  await vaciarBase(db);
  await cargarCatalogos(db);
  comida = (await db.categoriaGasto.findUniqueOrThrow({ where: { codigo: 'COMIDA' } })).id;
  ana = await registrar(app, 'Ana', 'ana@mail.com');
  tomas = await registrar(app, 'Tomás', 'tomas@mail.com');
  luis = await registrar(app, 'Luis', 'luis@mail.com');
  viajeId = (
    await ana.c.post('/api/viajes', {
      nombre: 'Bariloche',
      destino: 'Bariloche',
      fechaInicio: '2026-12-10',
      fechaFin: '2026-12-16',
      monedaCodigo: 'ARS',
    })
  ).body.viaje.id;
  for (const email of ['tomas@mail.com', 'luis@mail.com']) {
    await ana.c.post(url('/participantes'), { email });
  }
});

// La invariante del saldo neto por par se verifica después de cada prueba.
afterEach(() => verificarInvarianteDeSaldos(db));

const gasto = (c: Cliente, datos: object) =>
  c.post(url('/gastos'), {
    titulo: 'Cena',
    categoriaId: comida,
    monto: 1000,
    modoDivision: 'IGUALES',
    ...datos,
  });
const deudas = async (c: Cliente, rol: 'deudor' | 'acreedor') =>
  ((await c.get(url(`/deudas?rol=${rol}`))).body.deudas as DeudaVista[]).map((d) => [
    d.contraparte.nombre,
    d.monto,
  ]);

describe('Categorías', () => {
  it('GET /api/categorias-gasto devuelve las seis categorías', async () => {
    const r = await ana.c.get('/api/categorias-gasto');
    expect(r.body.categorias.map((c: { codigo: string }) => c.codigo).sort()).toEqual([
      'ACTIVIDADES',
      'ALOJAMIENTO',
      'COMIDA',
      'COMPRAS',
      'OTROS',
      'TRANSPORTE',
    ]);
  });
});

describe('CU20: anotar gasto', () => {
  it('RN-G4 a RN-G6: partes iguales con resto, sin deuda para la parte del pagador', async () => {
    const r = await gasto(ana.c, { deudores: [ana.id, tomas.id, luis.id] });
    expect(r.status).toBe(201);
    expect(r.body.gasto).toMatchObject({
      titulo: 'Cena',
      monto: 1000,
      modoDivision: 'IGUALES',
      categoria: { codigo: 'COMIDA' },
      pagadoPor: { id: ana.id },
      registradoPor: { id: ana.id },
    });
    expect(r.body.gasto.partes.map((p: { monto: number }) => p.monto)).toEqual([334, 333, 333]);
    expect(await deudas(ana.c, 'acreedor')).toEqual(
      expect.arrayContaining([
        ['Tomás', 333],
        ['Luis', 333],
      ]),
    );
    expect(await deudas(ana.c, 'deudor')).toEqual([]);
    expect((await tomas.c.get(url('/gastos'))).body.gastos).toHaveLength(1);
  });

  it('P13: el pagador puede no estar entre los elegidos', async () => {
    await gasto(ana.c, { pagadoPorId: tomas.id, deudores: [ana.id, luis.id], monto: 1001 });
    expect(await deudas(tomas.c, 'acreedor')).toEqual([
      ['Ana', 501],
      ['Luis', 500],
    ]);
  });

  it('P15: A le debe 10.000 a B y paga un gasto con parte de B de 4.000; queda A → B 6.000', async () => {
    await gasto(tomas.c, {
      monto: 10_000,
      deudores: [ana.id],
      modoDivision: 'ARBITRARIA',
      partes: [{ usuarioId: ana.id, monto: 10_000 }],
    });
    await gasto(ana.c, {
      monto: 4_000,
      deudores: [tomas.id],
      modoDivision: 'ARBITRARIA',
      partes: [{ usuarioId: tomas.id, monto: 4_000 }],
    });
    expect(await deudas(ana.c, 'deudor')).toEqual([['Tomás', 6_000]]);
    expect(await deudas(tomas.c, 'deudor')).toEqual([]);
  });

  it('RN-G4: división arbitraria cuya suma no coincide', async () => {
    const r = await gasto(ana.c, {
      deudores: [tomas.id, luis.id],
      modoDivision: 'ARBITRARIA',
      partes: [
        { usuarioId: tomas.id, monto: 600 },
        { usuarioId: luis.id, monto: 300 },
      ],
    });
    expect([r.status, r.body.error.codigo]).toEqual([422, 'SUMA_NO_COINCIDE']);
    expect(r.body.error.detalles).toEqual({ total: 1000, suma: 900, diferencia: 100 });
    expect(await db.gasto.count()).toBe(0);
  });

  it('valida los datos, los participantes y la categoría', async () => {
    const sofia = await registrar(app, 'Sofía', 'sofia@mail.com');
    const casos: [object, number, string][] = [
      [{ deudores: [] }, 400, 'VALIDACION'],
      [{ deudores: [tomas.id], monto: 0 }, 400, 'VALIDACION'],
      [{ deudores: [tomas.id], modoDivision: 'ARBITRARIA' }, 400, 'VALIDACION'],
      [{ deudores: [tomas.id], pagadoPorId: sofia.id }, 422, 'PAGADOR_NO_PARTICIPANTE'],
      [{ deudores: [tomas.id, sofia.id] }, 422, 'DEUDOR_NO_PARTICIPANTE'],
      [{ deudores: [tomas.id], categoriaId: crypto.randomUUID() }, 422, 'CATEGORIA_INEXISTENTE'],
    ];
    for (const [datos, estado, codigo] of casos) {
      const r = await gasto(ana.c, datos);
      expect([r.status, r.body.error.codigo]).toEqual([estado, codigo]);
    }
    expect(await db.gasto.count()).toBe(0);
  });

  it('D18: gastos simultáneos sobre el mismo par dejan el saldo correcto', async () => {
    const respuestas = await Promise.all([
      gasto(ana.c, { monto: 300, deudores: [tomas.id] }),
      gasto(ana.c, { monto: 500, deudores: [tomas.id] }),
      gasto(tomas.c, { monto: 200, deudores: [ana.id] }),
      gasto(tomas.c, { monto: 100, deudores: [ana.id, luis.id] }),
    ]);
    expect(respuestas.map((r) => r.status)).toEqual([201, 201, 201, 201]);
    // Tomás debe 800 a Ana y Ana le debe 250 (200 + 50): queda Tomás → Ana 550.
    expect(await deudas(tomas.c, 'deudor')).toEqual([['Ana', 550]]);
    expect(await deudas(ana.c, 'deudor')).toEqual([]);
    expect(await deudas(luis.c, 'deudor')).toEqual([['Tomás', 50]]);
  });
});

describe('RN-E6: acceso solo a saldos', () => {
  it('un exparticipante con saldos ve el detalle y sus deudas, y recibe 403 en el resto', async () => {
    await gasto(ana.c, { deudores: [luis.id] });
    await luis.c.post(url('/salir'), {});

    const detalle = await luis.c.get(url());
    expect([detalle.status, detalle.body.viaje.miAcceso]).toEqual([200, 'SOLO_SALDOS']);
    expect(await deudas(luis.c, 'deudor')).toEqual([['Ana', 1000]]);
    for (const ruta of ['/gastos', '/participantes', '/actividades', '/mensajes']) {
      expect((await luis.c.get(url(ruta))).status).toBe(403);
    }
    expect((await gasto(luis.c, { deudores: [ana.id] })).status).toBe(403);
    const lista = (await luis.c.get('/api/viajes')).body.viajes;
    expect(lista).toEqual([expect.objectContaining({ id: viajeId, miAcceso: 'SOLO_SALDOS' })]);
    // El acreedor también conserva el acceso: Ana le debe a Tomás y Tomás se va.
    await gasto(tomas.c, { deudores: [ana.id] });
    await ana.c.delete(url(`/participantes/${tomas.id}`));
    expect((await tomas.c.get(url('/deudas?rol=acreedor'))).status).toBe(200);
  });

  it('sin saldos pendientes pierde también ese acceso', async () => {
    await luis.c.post(url('/salir'), {});
    expect((await luis.c.get(url())).status).toBe(403);
    expect((await luis.c.get(url('/deudas?rol=deudor'))).status).toBe(403);
    expect((await luis.c.get('/api/viajes')).body.viajes).toEqual([]);
  });

  it('los participantes tienen acceso completo y el rol es obligatorio', async () => {
    expect((await tomas.c.get(url())).body.viaje.miAcceso).toBe('COMPLETO');
    expect((await tomas.c.get(url('/deudas'))).status).toBe(400);
    const extraño = await registrar(app, 'Sofía', 'sofia@mail.com');
    expect((await extraño.c.get(url('/deudas?rol=deudor'))).status).toBe(403);
  });
});
