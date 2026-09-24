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
let viajeId: string;
const url = (s = '') => `/api/viajes/${viajeId}${s}`;

beforeEach(async () => {
  app = crearApp(contenedor);
  await vaciarBase(db);
  await cargarCatalogos(db);
  ana = await registrar(app, 'Ana', 'ana@mail.com');
  tomas = await registrar(app, 'Tomás', 'tomas@mail.com');
  viajeId = (
    await ana.c.post('/api/viajes', {
      nombre: 'Bariloche',
      destino: 'Bariloche',
      fechaInicio: '2026-12-10',
      fechaFin: '2026-12-16',
      monedaCodigo: 'ARS',
    })
  ).body.viaje.id;
  await ana.c.post(url('/participantes'), { email: 'tomas@mail.com' });
  // Tomás le debe 1.000 a Ana.
  const comida = await db.categoriaGasto.findUniqueOrThrow({ where: { codigo: 'COMIDA' } });
  await ana.c.post(url('/gastos'), {
    titulo: 'Cena',
    categoriaId: comida.id,
    monto: 1_000,
    deudores: [tomas.id],
    modoDivision: 'IGUALES',
  });
});

afterEach(() => verificarInvarianteDeSaldos(db));

const pagar = (c: Cliente, acreedorId: string, monto: number) =>
  c.post(url('/pagos'), { acreedorId, monto });
const deudas = async (c: Cliente, rol: 'deudor' | 'acreedor') =>
  (await c.get(url(`/deudas?rol=${rol}`))).body.deudas as DeudaVista[];

describe('CU23: registrar pago', () => {
  it('pago parcial: resta, informa el saldo y aparece en el historial de los dos', async () => {
    const r = await pagar(tomas.c, ana.id, 400);
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({
      saldo: 600,
      pago: { monto: 400, registradoPor: { id: tomas.id, nombre: 'Tomás' } },
    });
    const [deTomas] = await deudas(tomas.c, 'deudor');
    const [deAna] = await deudas(ana.c, 'acreedor');
    expect(deTomas).toMatchObject({ monto: 600, pagos: [r.body.pago] });
    expect(deAna).toMatchObject({ monto: 600, pagos: [r.body.pago] });
    expect(Date.parse(r.body.pago.fecha)).not.toBeNaN();
  });

  it('pago exacto: el saldo queda en cero y la deuda desaparece de ambas listas', async () => {
    await pagar(tomas.c, ana.id, 300);
    const r = await pagar(tomas.c, ana.id, 700);
    expect(r.body.saldo).toBe(0);
    expect(await deudas(tomas.c, 'deudor')).toEqual([]);
    expect(await deudas(ana.c, 'acreedor')).toEqual([]);
    expect(await db.pago.count()).toBe(2);
  });

  it('RN-P4: un pago mayor que la deuda responde 422 sin cambios en la base', async () => {
    const r = await pagar(tomas.c, ana.id, 1_001);
    expect([r.status, r.body.error.codigo, r.body.error.detalles]).toEqual([
      422,
      'PAGO_EXCEDE_DEUDA',
      { saldo: 1_000 },
    ]);
    expect(await db.pago.count()).toBe(0);
    expect((await deudas(tomas.c, 'deudor'))[0]?.monto).toBe(1_000);
  });

  it('P17: quien no es el deudor no puede registrar el pago', async () => {
    const r = await pagar(ana.c, tomas.id, 100);
    expect([r.status, r.body.error.codigo]).toEqual([404, 'SIN_DEUDA_CON_ACREEDOR']);
    const extraño = await registrar(app, 'Luis', 'luis@mail.com');
    expect((await pagar(extraño.c, ana.id, 100)).status).toBe(403);
    expect((await pagar(tomas.c, ana.id, 0)).status).toBe(400);
    expect((await pagar(tomas.c, crypto.randomUUID(), 10)).status).toBe(404);
    expect(await db.pago.count()).toBe(0);
  });

  it('RN-E6: un exparticipante con saldo pendiente puede pagar, y al saldar pierde el acceso', async () => {
    await ana.c.delete(url(`/participantes/${tomas.id}`));
    expect((await pagar(tomas.c, ana.id, 400)).status).toBe(201);
    expect((await tomas.c.get(url())).body.viaje.miAcceso).toBe('SOLO_SALDOS');
    expect((await pagar(tomas.c, ana.id, 600)).body.saldo).toBe(0);
    expect((await tomas.c.get(url())).status).toBe(403);
    expect((await tomas.c.get('/api/viajes')).body.viajes).toEqual([]);
  });

  it('D18: dos pagos simultáneos que juntos superan el saldo: uno se registra y el otro no', async () => {
    const respuestas = await Promise.all([
      pagar(tomas.c, ana.id, 700),
      pagar(tomas.c, ana.id, 600),
    ]);
    expect(respuestas.map((r) => r.status).sort()).toEqual([201, 422]);
    const rechazado = respuestas.find((r) => r.status === 422)!;
    expect(rechazado.body.error.codigo).toBe('PAGO_EXCEDE_DEUDA');
    expect(await db.pago.count()).toBe(1);
  });
});
