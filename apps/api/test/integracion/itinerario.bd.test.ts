import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../../src/app.js';
import { vaciarBase } from '../soporte/baseDePrueba.js';
import { crearApiDePrueba, registrar, type Cliente } from '../soporte/apiDePrueba.js';

const { contenedor } = crearApiDePrueba();
const db = contenedor.prisma;
let app = crearApp(contenedor);
afterAll(() => db.$disconnect());

let ana: { c: Cliente; id: string };
let viajeId: string;
const url = (s = '') => `/api/viajes/${viajeId}${s}`;

beforeEach(async () => {
  app = crearApp(contenedor);
  await vaciarBase(db);
  await db.moneda.create({ data: { codigo: 'ARS', nombre: 'Peso argentino', decimales: 2 } });
  ana = await registrar(app, 'Ana', 'ana@mail.com');
  viajeId = (
    await ana.c.post('/api/viajes', {
      nombre: 'Bariloche',
      destino: 'Bariloche',
      fechaInicio: '2026-12-10',
      fechaFin: '2026-12-13',
      monedaCodigo: 'ARS',
    })
  ).body.viaje.id;
});

async function actividadConfirmada(
  titulo: string,
  fecha: string,
  horaInicio: string,
  latitud: number,
) {
  const r = await ana.c.post(url('/actividades'), {
    titulo,
    descripcion: `desc ${titulo}`,
    ubicacion: `lugar ${titulo}`,
    latitud,
    longitud: -71.3,
    fecha,
    horaInicio,
    duracionMin: 60,
  });
  await ana.c.post(url(`/propuestas/${r.body.actividad.id}/confirmar`));
  return r.body.actividad.id as string;
}

async function alojamientoConfirmado(nombre: string, fechaDesde: string, fechaHasta: string) {
  const r = await ana.c.post(url('/alojamientos'), {
    nombre,
    descripcion: 'x',
    ubicacion: `calle ${nombre}`,
    fechaDesde,
    fechaHasta,
  });
  await ana.c.post(url(`/propuestas/${r.body.alojamiento.id}/confirmar`));
  return r.body.alojamiento.id as string;
}

describe('CU16: GET …/cronograma', () => {
  it('todos los días, con actividades confirmadas en orden y el alojamiento de cada noche', async () => {
    const cena = await actividadConfirmada('Cena', '2026-12-11', '21:00', -41.1);
    const kayak = await actividadConfirmada('Kayak', '2026-12-11', '10:00', -41.2);
    await ana.c.post(url('/actividades'), {
      titulo: 'Pendiente',
      descripcion: 'x',
      ubicacion: 'y',
      latitud: -41,
      longitud: -71,
      fecha: '2026-12-12',
      horaInicio: '10:00',
      duracionMin: 60,
    });
    const hostel = await alojamientoConfirmado('Hostel', '2026-12-10', '2026-12-12');

    const r = await ana.c.get(url('/cronograma'));
    expect(r.status).toBe(200);
    expect(r.body.dias.map((d: { fecha: string }) => d.fecha)).toEqual([
      '2026-12-10',
      '2026-12-11',
      '2026-12-12',
      '2026-12-13',
    ]);
    const [primero, segundo, tercero] = r.body.dias;
    expect(primero.actividades).toEqual([]);
    expect(segundo.actividades.map((a: { id: string }) => a.id)).toEqual([kayak, cena]);
    expect(segundo.actividades[0]).toMatchObject({
      titulo: 'Kayak',
      horaInicio: '10:00',
      horaFin: '11:00',
      ubicacion: 'lugar Kayak',
    });
    expect(tercero.actividades).toEqual([]);
    expect(
      r.body.dias.map((d: { alojamientos: { id: string }[] }) => d.alojamientos.map((a) => a.id)),
    ).toEqual([[hostel], [hostel], [], []]);
  });
});

describe('CU17: GET …/mapa', () => {
  it('abre el día indicado con las actividades en orden y el recorrido', async () => {
    await actividadConfirmada('Cena', '2026-12-11', '21:00', -41.3);
    await actividadConfirmada('Kayak', '2026-12-11', '10:00', -41.1);
    const r = await ana.c.get(url('/mapa?hoy=2026-09-24&dia=2026-12-11'));
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({
      dia: '2026-12-11',
      diasConActividad: ['2026-12-11'],
      aviso: null,
    });
    expect(r.body.actividades.map((a: { titulo: string }) => a.titulo)).toEqual(['Kayak', 'Cena']);
    expect(r.body.recorrido).toEqual([
      { latitud: -41.1, longitud: -71.3 },
      { latitud: -41.3, longitud: -71.3 },
    ]);
  });

  it('RN-M1: sin día, hoy fuera del viaje, abre el primer día con actividades', async () => {
    await actividadConfirmada('Museo', '2026-12-12', '15:00', -41.1);
    expect((await ana.c.get(url('/mapa?hoy=2026-09-24'))).body.dia).toBe('2026-12-12');
    expect((await ana.c.get(url('/mapa?hoy=2026-12-10'))).body.dia).toBe('2026-12-10');
  });

  it('RN-M3 y RN-M7: al cambiar a un día vacío responde con el aviso', async () => {
    await actividadConfirmada('Museo', '2026-12-12', '15:00', -41.1);
    const r = await ana.c.get(url('/mapa?hoy=2026-09-24&dia=2026-12-13'));
    expect(r.body).toMatchObject({
      dia: '2026-12-13',
      actividades: [],
      recorrido: [],
      aviso: 'SIN_ACTIVIDADES_CONFIRMADAS',
    });
  });

  it('valida los parámetros y que el día esté dentro del viaje', async () => {
    const sinHoy = await ana.c.get(url('/mapa'));
    expect([sinHoy.status, sinHoy.body.error.codigo]).toEqual([400, 'VALIDACION']);
    expect((await ana.c.get(url('/mapa?hoy=24-09-2026'))).status).toBe(400);
    const fuera = await ana.c.get(url('/mapa?hoy=2026-09-24&dia=2026-12-20'));
    expect([fuera.status, fuera.body.error.codigo]).toEqual([422, 'FUERA_DEL_VIAJE']);
  });

  it('solo participantes', async () => {
    const luis = await registrar(app, 'Luis', 'luis@mail.com');
    expect((await luis.c.get(url('/mapa?hoy=2026-09-24'))).status).toBe(403);
    expect((await luis.c.get(url('/cronograma'))).status).toBe(403);
  });
});
