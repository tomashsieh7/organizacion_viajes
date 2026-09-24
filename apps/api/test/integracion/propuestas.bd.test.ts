import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../../src/app.js';
import { vaciarBase } from '../soporte/baseDePrueba.js';
import { crearApiDePrueba, registrar, type Cliente } from '../soporte/apiDePrueba.js';

const { contenedor } = crearApiDePrueba();
const db = contenedor.prisma;
let app = crearApp(contenedor);
afterAll(() => db.$disconnect());

let ana: { c: Cliente; id: string };
let tomas: { c: Cliente; id: string };
let viajeId: string;
const url = (s = '') => `/api/viajes/${viajeId}${s}`;
const hostel = {
  nombre: 'Hostel Patagonia',
  descripcion: 'Con desayuno',
  ubicacion: 'Mitre 100',
  latitud: -41.13,
  longitud: -71.31,
  fechaDesde: '2026-12-10',
  fechaHasta: '2026-12-13',
  precio: 4_800_000,
};

beforeEach(async () => {
  app = crearApp(contenedor);
  await vaciarBase(db);
  await db.moneda.create({ data: { codigo: 'ARS', nombre: 'Peso argentino', decimales: 2 } });
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
});

const proponer = async (datos = hostel) => {
  const r = await tomas.c.post(url('/alojamientos'), datos);
  return r.body.alojamiento?.id as string;
};

describe('CU05: proponer alojamiento', () => {
  it('lo guarda pendiente y lo lista con sus datos', async () => {
    const r = await tomas.c.post(url('/alojamientos'), hostel);
    expect(r.status).toBe(201);
    expect(r.body.alojamiento).toMatchObject({
      estado: 'PENDIENTE',
      precio: 4_800_000,
      latitud: -41.13,
      votosAFavor: 0,
      miVoto: null,
      autor: { usuarioId: tomas.id, nombre: 'Tomás' },
      alojamiento: {
        nombre: 'Hostel Patagonia',
        fechaDesde: '2026-12-10',
        fechaHasta: '2026-12-13',
      },
    });
    expect((await ana.c.get(url('/alojamientos'))).body.alojamientos).toHaveLength(1);
  });

  it('RN-X4: rechaza fechas fuera del viaje y valida los datos', async () => {
    const fuera = await tomas.c.post(url('/alojamientos'), { ...hostel, fechaHasta: '2026-12-17' });
    expect([fuera.status, fuera.body.error.codigo]).toEqual([422, 'FUERA_DEL_VIAJE']);
    expect(fuera.body.error.detalles).toEqual({ desde: '2026-12-10', hasta: '2026-12-16' });
    const invertido = await tomas.c.post(url('/alojamientos'), {
      ...hostel,
      fechaDesde: '2026-12-14',
    });
    expect(invertido.status).toBe(400);
    const sinLongitud = await tomas.c.post(url('/alojamientos'), {
      ...hostel,
      longitud: undefined,
    });
    expect(sinLongitud.status).toBe(400);
    const sinCoordenadas = await tomas.c.post(url('/alojamientos'), {
      ...hostel,
      latitud: undefined,
      longitud: undefined,
    });
    expect(sinCoordenadas.status).toBe(201);
  });

  it('filtra por estado y rechaza estados inválidos', async () => {
    const id = await proponer();
    await ana.c.post(url(`/propuestas/${id}/confirmar`));
    await proponer({ ...hostel, nombre: 'Otro' });
    expect(
      (await ana.c.get(url('/alojamientos?estado=CONFIRMADA'))).body.alojamientos.map(
        (a: { id: string }) => a.id,
      ),
    ).toEqual([id]);
    expect((await ana.c.get(url('/alojamientos?estado=RARO'))).status).toBe(400);
  });
});

describe('CU06 y CU25: votar y desvotar', () => {
  it('vota, reemplaza el voto y desvota', async () => {
    const id = await proponer();
    const v1 = await tomas.c.put(url(`/propuestas/${id}/voto`), { valor: 'A_FAVOR' });
    expect(v1.body.propuesta).toMatchObject({ votosAFavor: 1, miVoto: 'A_FAVOR' });
    const v2 = await tomas.c.put(url(`/propuestas/${id}/voto`), { valor: 'EN_CONTRA' });
    expect(v2.body.propuesta).toMatchObject({
      votosAFavor: 0,
      votosEnContra: 1,
      miVoto: 'EN_CONTRA',
    });
    const d = await tomas.c.delete(url(`/propuestas/${id}/voto`));
    expect(d.body.propuesta).toMatchObject({ votosEnContra: 0, miVoto: null });
    const otraVez = await tomas.c.delete(url(`/propuestas/${id}/voto`));
    expect([otraVez.status, otraVez.body.error.codigo]).toEqual([404, 'SIN_VOTO']);
  });

  it('no se vota ni desvota una propuesta resuelta', async () => {
    const id = await proponer();
    await tomas.c.put(url(`/propuestas/${id}/voto`), { valor: 'A_FAVOR' });
    await ana.c.post(url(`/propuestas/${id}/denegar`));
    const voto = await ana.c.put(url(`/propuestas/${id}/voto`), { valor: 'A_FAVOR' });
    const desvoto = await tomas.c.delete(url(`/propuestas/${id}/voto`));
    for (const r of [voto, desvoto])
      expect([r.status, r.body.error.codigo]).toEqual([409, 'PROPUESTA_NO_PENDIENTE']);
  });

  it('valida el valor del voto y que la propuesta sea del viaje', async () => {
    const id = await proponer();
    const invalido = await tomas.c.put(url(`/propuestas/${id}/voto`), { valor: 'TAL_VEZ' });
    expect(invalido.status).toBe(400);
    const ajena = await tomas.c.put(url(`/propuestas/${crypto.randomUUID()}/voto`), {
      valor: 'A_FAVOR',
    });
    expect(ajena.status).toBe(404);
  });
});

describe('CU07 a CU09: resolución', () => {
  const ACCIONES = ['confirmar', 'denegar', 'cancelar'] as const;
  const CAMINO: Record<string, (typeof ACCIONES)[number][]> = {
    PENDIENTE: [],
    CONFIRMADA: ['confirmar'],
    DENEGADA: ['denegar'],
    CANCELADA: ['confirmar', 'cancelar'],
  };
  const ESPERADO: Record<string, Partial<Record<(typeof ACCIONES)[number], string>>> = {
    PENDIENTE: { confirmar: 'CONFIRMADA', denegar: 'DENEGADA' },
    CONFIRMADA: { cancelar: 'CANCELADA' },
    DENEGADA: {},
    CANCELADA: {},
  };

  for (const [estado, pasos] of Object.entries(CAMINO)) {
    it(`RN-R1: matriz de transiciones desde ${estado}`, async () => {
      for (const accion of ACCIONES) {
        const id = await proponer();
        for (const paso of pasos)
          expect((await ana.c.post(url(`/propuestas/${id}/${paso}`))).status).toBe(200);
        const r = await ana.c.post(url(`/propuestas/${id}/${accion}`));
        const destino = ESPERADO[estado]![accion];
        if (destino) {
          expect(r.status).toBe(200);
          expect(r.body).toMatchObject({ propuesta: { estado: destino }, afectadas: [] });
          expect(r.body.propuesta.resueltaEn).not.toBeNull();
        } else {
          expect([r.status, r.body.error.codigo]).toEqual([409, 'TRANSICION_INVALIDA']);
        }
      }
    });
  }

  it('RN-X2: solo el Admin resuelve', async () => {
    const id = await proponer();
    const r = await tomas.c.post(url(`/propuestas/${id}/confirmar`));
    expect([r.status, r.body.error.codigo]).toEqual([403, 'SOLO_ADMIN']);
  });
});
