import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../../src/app.js';
import { vaciarBase } from '../soporte/baseDePrueba.js';
import { crearApiDePrueba, ORIGEN, registrar, type Cliente } from '../soporte/apiDePrueba.js';

const { contenedor } = crearApiDePrueba();
const db = contenedor.prisma;
let app = crearApp(contenedor);
afterAll(() => db.$disconnect());

let ana: { c: Cliente; id: string };
let tomas: { c: Cliente; id: string };
let luis: { c: Cliente; id: string };
let viajeId: string;
const url = (s = '') => `/api/viajes/${viajeId}${s}`;
// Jueves 10 a miércoles 16 de diciembre.
const datos = {
  nombre: 'Bariloche',
  destino: 'Bariloche',
  fechaInicio: '2026-12-10',
  fechaFin: '2026-12-16',
};

beforeEach(async () => {
  app = crearApp(contenedor);
  await vaciarBase(db);
  await db.moneda.createMany({
    data: [
      { codigo: 'ARS', nombre: 'Peso argentino', decimales: 2 },
      { codigo: 'CLP', nombre: 'Peso chileno', decimales: 0 },
    ],
  });
  ana = await registrar(app, 'Ana', 'ana@mail.com');
  tomas = await registrar(app, 'Tomás', 'tomas@mail.com');
  luis = await registrar(app, 'Luis', 'luis@mail.com');
  viajeId = (await ana.c.post('/api/viajes', { ...datos, monedaCodigo: 'ARS' })).body.viaje.id;
  await ana.c.post(url('/participantes'), { email: 'tomas@mail.com' });
});

const cambiar = (cambios: Partial<typeof datos>, quien = ana) =>
  quien.c.patch(url(), { ...datos, ...cambios });

async function actividad(titulo: string, fecha: string, horaInicio = '10:00') {
  const r = await tomas.c.post(url('/actividades'), {
    titulo,
    ubicacion: 'Lago',
    latitud: -41.1,
    longitud: -71.4,
    fecha,
    horaInicio,
    duracionMin: 60,
  });
  if (r.status !== 201) throw new Error(JSON.stringify(r.body));
  return r.body.actividad.id as string;
}

async function alojamiento(nombre: string, fechaDesde: string, fechaHasta: string) {
  const r = await tomas.c.post(url('/alojamientos'), {
    nombre,
    ubicacion: 'Centro',
    fechaDesde,
    fechaHasta,
  });
  if (r.status !== 201) throw new Error(JSON.stringify(r.body));
  return r.body.alojamiento.id as string;
}

const resolver = (id: string, accion: 'confirmar' | 'denegar' | 'cancelar') =>
  ana.c.post(url(`/propuestas/${id}/${accion}`));
const fechaDe = async (id: string) =>
  (await ana.c.get(url(`/actividades/${id}`))).body.actividad.actividad.fecha;
const estadiaDe = async (id: string) => {
  const { fechaDesde, fechaHasta } = (await ana.c.get(url('/alojamientos'))).body.alojamientos.find(
    (a: { id: string }) => a.id === id,
  ).alojamiento;
  return [fechaDesde, fechaHasta];
};

describe('CU27: modificar los datos del viaje', () => {
  it('CU27 y RN-V1: el Admin cambia nombre, destino y fechas; la moneda no se edita', async () => {
    const r = await ana.c.patch(url(), {
      nombre: '  Sur  ',
      destino: 'El Bolsón',
      fechaInicio: '2026-12-08',
      fechaFin: '2026-12-20',
      monedaCodigo: 'CLP',
    });
    expect(r.status).toBe(200);
    expect(r.body.viaje).toMatchObject({
      id: viajeId,
      nombre: 'Sur',
      destino: 'El Bolsón',
      fechaInicio: '2026-12-08',
      fechaFin: '2026-12-20',
      moneda: { codigo: 'ARS' },
      miRol: 'ADMIN',
    });
    expect(r.body.reacomodo).toEqual({ semanas: 0, movidas: 0 });
    expect((await tomas.c.get(url())).body.viaje.nombre).toBe('Sur');
  });

  it('RN-V1: un viajero, quien no participa y quien no inició sesión no pueden', async () => {
    const viajero = await cambiar({ nombre: 'Otro' }, tomas);
    expect([viajero.status, viajero.body.error.codigo]).toEqual([403, 'SOLO_ADMIN']);
    const ajeno = await cambiar({ nombre: 'Otro' }, luis);
    expect([ajeno.status, ajeno.body.error.codigo]).toEqual([403, 'NO_PARTICIPANTE']);
    const anonimo = await request(app)
      .patch(url())
      .set('Origin', ORIGEN)
      .send({ ...datos, nombre: 'Otro' });
    expect(anonimo.status).toBe(401);
    const otroSitio = await request(app)
      .patch(url())
      .set('Origin', 'https://otro.sitio')
      .send({ ...datos, nombre: 'Otro' });
    expect(otroSitio.status).toBe(403);
    expect((await ana.c.get(url())).body.viaje.nombre).toBe('Bariloche');
  });

  it('RN-V1: valida como al crear el viaje', async () => {
    const casos: [Partial<typeof datos>, string][] = [
      [{ fechaFin: '2026-12-09' }, 'fechaFin'],
      [{ fechaFin: '2027-12-11' }, 'fechaFin'],
      [{ fechaInicio: '2026-02-30' }, 'fechaInicio'],
      [{ nombre: '   ' }, 'nombre'],
      [{ destino: 'x'.repeat(200) }, 'destino'],
      [{ nombre: 'Viaje\u0000' }, 'nombre'],
    ];
    for (const [cambios, campo] of casos) {
      const r = await cambiar(cambios);
      expect([r.status, r.body.error.detalles?.[0]?.campo]).toEqual([400, campo]);
    }
    expect((await ana.c.patch(url(), { nombre: 'Solo nombre' })).status).toBe(400);
    expect((await ana.c.get(url())).body.viaje).toMatchObject(datos);
  });

  it('RN-X1: un viaje inexistente o un id inválido no se encuentran', async () => {
    expect((await ana.c.patch('/api/viajes/no-es-un-id', datos)).status).toBe(404);
    const inexistente = await ana.c.patch(`/api/viajes/${crypto.randomUUID()}`, datos);
    expect(inexistente.status).toBe(403);
  });
});

describe('RN-V2 y RN-V3: reacomodo de las propuestas', () => {
  it('RN-V2: alargar o achicar sin dejar nada afuera no mueve nada', async () => {
    const kayak = await actividad('Kayak', '2026-12-12');
    const hostel = await alojamiento('Hostel', '2026-12-11', '2026-12-14');
    for (const [fechaInicio, fechaFin] of [
      ['2026-12-03', '2026-12-25'],
      ['2026-12-11', '2026-12-14'],
    ] as const) {
      const r = await cambiar({ fechaInicio, fechaFin });
      expect([r.status, r.body.reacomodo]).toEqual([200, { semanas: 0, movidas: 0 }]);
    }
    expect(await fechaDe(kayak)).toBe('2026-12-12');
    expect(await estadiaDe(hostel)).toEqual(['2026-12-11', '2026-12-14']);
  });

  it('RN-V2: corrido una semana, todo se corre con sus votos, su estado y sus noches', async () => {
    const kayak = await actividad('Kayak', '2026-12-11');
    await resolver(kayak, 'confirmar');
    const cena = await actividad('Cena', '2026-12-16', '21:00');
    await tomas.c.put(url(`/propuestas/${cena}/voto`), { valor: 'A_FAVOR' });
    const denegada = await actividad('Rafting', '2026-12-13');
    await resolver(denegada, 'denegar');
    const hostel = await alojamiento('Hostel', '2026-12-10', '2026-12-13');

    const r = await cambiar({ fechaInicio: '2026-12-17', fechaFin: '2026-12-23' });
    expect([r.status, r.body.reacomodo]).toEqual([200, { semanas: 1, movidas: 4 }]);

    expect(await fechaDe(kayak)).toBe('2026-12-18');
    expect(await fechaDe(cena)).toBe('2026-12-23');
    expect(await fechaDe(denegada)).toBe('2026-12-20');
    expect(await estadiaDe(hostel)).toEqual(['2026-12-17', '2026-12-20']);
    const vista = (await tomas.c.get(url(`/actividades/${cena}`))).body.actividad;
    expect(vista).toMatchObject({ estado: 'PENDIENTE', votosAFavor: 1, miVoto: 'A_FAVOR' });
    expect(vista.actividad.horaInicio).toBe('21:00');
    expect((await ana.c.get(url(`/actividades/${kayak}`))).body.actividad.estado).toBe(
      'CONFIRMADA',
    );
  });

  it('RN-V2: corrido dos semanas para atrás y alargado, se corre si sin mover algo queda afuera', async () => {
    const kayak = await actividad('Kayak', '2026-12-16');
    const r = await cambiar({ fechaInicio: '2026-11-26', fechaFin: '2026-12-04' });
    expect([r.status, r.body.reacomodo]).toEqual([200, { semanas: -2, movidas: 1 }]);
    expect(await fechaDe(kayak)).toBe('2026-12-02');
  });

  it('RN-V3: si algo pendiente o confirmado queda afuera, 409 con la lista y no se guarda nada', async () => {
    const kayak = await actividad('Kayak', '2026-12-15');
    await resolver(kayak, 'confirmar');
    const hostel = await alojamiento('Hostel', '2026-12-12', '2026-12-14');
    await actividad('Trekking', '2026-12-11');

    const r = await cambiar({ nombre: 'Corto', fechaInicio: '2026-12-10', fechaFin: '2026-12-13' });
    expect([r.status, r.body.error.codigo]).toEqual([409, 'REACOMODO_NECESARIO']);
    expect(r.body.error.detalles.propuestas).toEqual(
      expect.arrayContaining([
        { id: kayak, tipo: 'ACTIVIDAD', titulo: 'Kayak', desde: '2026-12-15', hasta: '2026-12-15' },
        {
          id: hostel,
          tipo: 'ALOJAMIENTO',
          titulo: 'Hostel',
          desde: '2026-12-12',
          hasta: '2026-12-14',
        },
      ]),
    );
    expect(r.body.error.detalles.propuestas).toHaveLength(2);
    expect((await ana.c.get(url())).body.viaje).toMatchObject(datos);
    expect(await fechaDe(kayak)).toBe('2026-12-15');
  });

  it('RN-V3: las denegadas y canceladas nunca impiden achicar', async () => {
    const denegada = await actividad('Kayak', '2026-12-15');
    await resolver(denegada, 'denegar');
    const cancelada = await actividad('Cena', '2026-12-16');
    await resolver(cancelada, 'confirmar');
    await resolver(cancelada, 'cancelar');
    const r = await cambiar({ fechaFin: '2026-12-13' });
    expect([r.status, r.body.reacomodo]).toEqual([200, { semanas: 0, movidas: 0 }]);
  });
});

describe('RN-V4: cambiar las fechas y proponer a la vez', () => {
  it('RN-V4: una propuesta nunca queda fuera de las fechas del viaje', async () => {
    const original = await actividad('Kayak', '2026-12-11');
    for (let vuelta = 0; vuelta < 8; vuelta++) {
      // Las propuestas de la vuelta anterior se deniegan para poder volver a achicar.
      for (const p of await db.propuesta.findMany({ where: { viajeId, estado: 'PENDIENTE' } })) {
        if (p.id !== original) await resolver(p.id, 'denegar');
      }
      expect((await cambiar({})).status).toBe(200);
      const [achicar, ...propuestas] = await Promise.all([
        cambiar({ fechaFin: '2026-12-12' }),
        tomas.c.post(url('/actividades'), {
          titulo: `Cena ${vuelta}`,
          ubicacion: 'Centro',
          latitud: -41.1,
          longitud: -71.4,
          fecha: '2026-12-15',
          horaInicio: '21:00',
          duracionMin: 60,
        }),
        tomas.c.post(url('/alojamientos'), {
          nombre: `Cabaña ${vuelta}`,
          ubicacion: 'Lago',
          fechaDesde: '2026-12-12',
          fechaHasta: '2026-12-14',
        }),
        tomas.c.post(url(`/actividades/${original}/alternativas`), {
          titulo: `Rafting ${vuelta}`,
          ubicacion: 'Río',
          latitud: -41.1,
          longitud: -71.4,
          fecha: '2026-12-14',
          horaInicio: '10:00',
          duracionMin: 60,
        }),
      ]);
      expect([200, 409]).toContain(achicar!.status);
      for (const p of propuestas) expect([201, 422]).toContain(p.status);
      const viaje = (await ana.c.get(url())).body.viaje;
      const enJuego = { viajeId, estado: { in: ['PENDIENTE' as const, 'CONFIRMADA' as const] } };
      const actividades = await db.actividad.findMany({ where: { propuesta: enJuego } });
      const alojamientos = await db.alojamiento.findMany({ where: { propuesta: enJuego } });
      const dias = [
        ...actividades.map((a) => a.fecha),
        ...alojamientos.flatMap((a) => [a.fechaDesde, a.fechaHasta]),
      ].map((d) => d.toISOString().slice(0, 10));
      for (const dia of dias) {
        expect(dia >= viaje.fechaInicio && dia <= viaje.fechaFin).toBe(true);
      }
    }
  });
});
