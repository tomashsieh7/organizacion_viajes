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
      // RN-X8: el título no admite caracteres de control ni de inversión del texto, y se tiene que ver.
      [{ deudores: [tomas.id], titulo: 'Cena\u0000' }, 400, 'VALIDACION'],
      [{ deudores: [tomas.id], titulo: 'Cena \u202Eanec' }, 400, 'VALIDACION'],
      [{ deudores: [tomas.id], titulo: 'Cena\ncara' }, 400, 'VALIDACION'],
      [{ deudores: [tomas.id], titulo: '\u200B' }, 400, 'VALIDACION'],
    ];
    for (const [datos, estado, codigo] of casos) {
      const r = await gasto(ana.c, datos);
      expect([r.status, r.body.error.codigo]).toEqual([estado, codigo]);
    }
    expect(await db.gasto.count()).toBe(0);
  });

  it('RN-G7: reintentar un gasto con el mismo id no lo anota dos veces', async () => {
    const id = crypto.randomUUID();
    const datos = { id, monto: 3000, deudores: [ana.id, tomas.id, luis.id] };
    const primero = await gasto(ana.c, datos);
    expect([primero.status, primero.body.gasto.id]).toEqual([201, id]);
    const reintento = await gasto(ana.c, datos);
    expect([reintento.status, reintento.body.gasto]).toEqual([201, primero.body.gasto]);
    // Varios intentos a la vez con otro id: uno solo se guarda y todos lo devuelven.
    const otro = crypto.randomUUID();
    const simultaneos = await Promise.all(
      Array.from({ length: 5 }, () => gasto(ana.c, { ...datos, id: otro })),
    );
    expect(simultaneos.map((r) => [r.status, r.body.gasto.id])).toEqual(
      Array.from({ length: 5 }, () => [201, otro]),
    );
    expect(await db.gasto.count()).toBe(2);
    expect(await deudas(tomas.c, 'deudor')).toEqual([['Ana', 2000]]);
    // El id de un gasto de otra persona o de otro viaje no se puede usar.
    const ajeno = await gasto(tomas.c, { id, deudores: [tomas.id] });
    expect([ajeno.status, ajeno.body.error.codigo]).toEqual([409, 'GASTO_EXISTENTE']);
    const otroViaje = (
      await ana.c.post('/api/viajes', {
        nombre: 'Otro',
        destino: 'Otro',
        fechaInicio: '2026-12-10',
        fechaFin: '2026-12-16',
        monedaCodigo: 'ARS',
      })
    ).body.viaje.id;
    const enOtroViaje = await ana.c.post(`/api/viajes/${otroViaje}/gastos`, {
      id,
      titulo: 'Cena',
      categoriaId: comida,
      monto: 1000,
      modoDivision: 'IGUALES',
      deudores: [ana.id],
    });
    expect([enOtroViaje.status, enOtroViaje.body.error.codigo]).toEqual([409, 'GASTO_EXISTENTE']);
    expect(await db.gasto.count()).toBe(2);
  });

  it('un gasto que haría superar el monto máximo a una deuda se rechaza sin guardar nada', async () => {
    const maximo = Number.MAX_SAFE_INTEGER;
    expect((await gasto(ana.c, { monto: maximo, deudores: [tomas.id] })).status).toBe(201);
    const r = await gasto(ana.c, { monto: maximo, deudores: [tomas.id] });
    expect([r.status, r.body.error.codigo]).toEqual([422, 'MONTO_DEMASIADO_GRANDE']);
    expect(await db.gasto.count()).toBe(1);
    expect(await deudas(tomas.c, 'deudor')).toEqual([['Ana', maximo]]);
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

  it('D18: gastos opuestos simultáneos entre dos personas sin deudas previas no se traban', async () => {
    // Cada vuelta usa un viaje nuevo, así las filas de deuda del par todavía no existen y las dos
    // transacciones tienen que crearlas a la vez (antes, en orden inverso, podían trabarse).
    for (let vuelta = 0; vuelta < 15; vuelta++) {
      const nuevo = (
        await ana.c.post('/api/viajes', {
          nombre: `Vuelta ${vuelta}`,
          destino: 'Bariloche',
          fechaInicio: '2026-12-10',
          fechaFin: '2026-12-16',
          monedaCodigo: 'ARS',
        })
      ).body.viaje.id as string;
      await ana.c.post(`/api/viajes/${nuevo}/participantes`, { email: 'tomas@mail.com' });
      const anotar = (c: Cliente, deudor: string) =>
        c.post(`/api/viajes/${nuevo}/gastos`, {
          titulo: 'Cena',
          categoriaId: comida,
          monto: 1000,
          modoDivision: 'IGUALES',
          deudores: [deudor],
        });
      const respuestas = await Promise.all([anotar(ana.c, tomas.id), anotar(tomas.c, ana.id)]);
      expect(respuestas.map((r) => r.status)).toEqual([201, 201]);
    }
  });

  it('D18: muchos gastos simultáneos se guardan todos, aunque superen las conexiones a la base', async () => {
    // Con más transacciones que conexiones, una consulta fuera de la transacción trababa el pool
    // hasta que vencían todas.
    const respuestas = await Promise.all(
      Array.from({ length: 30 }, (_, i) =>
        gasto([ana, tomas, luis][i % 3]!.c, {
          monto: 1000 + i,
          deudores: [ana.id, tomas.id, luis.id],
        }),
      ),
    );
    expect(respuestas.filter((r) => r.status !== 201)).toEqual([]);
    expect(await db.gasto.count()).toBe(30);
  });

  it('D18: una baja simultánea con un gasto nunca deja al dado de baja con una deuda no registrada', async () => {
    const [anotado, baja] = await Promise.all([
      gasto(tomas.c, { monto: 300, deudores: [luis.id] }),
      ana.c.delete(url(`/participantes/${luis.id}`)),
    ]);
    expect(baja.status).toBe(200);
    if (anotado.status === 201) {
      expect(baja.body).toEqual({ bajaConDeuda: true });
    } else {
      expect([anotado.status, anotado.body.error.codigo]).toEqual([422, 'DEUDOR_NO_PARTICIPANTE']);
      expect(baja.body).toEqual({ bajaConDeuda: false });
    }
    const membresia = await db.membresia.findUniqueOrThrow({
      where: { viajeId_usuarioId: { viajeId, usuarioId: luis.id } },
    });
    expect(membresia.bajaConDeuda).toBe(anotado.status === 201);
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
