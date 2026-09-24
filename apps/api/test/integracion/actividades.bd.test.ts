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
const kayak = {
  titulo: 'Kayak en el Nahuel Huapi',
  descripcion: 'Salida guiada',
  ubicacion: 'Bahía López',
  latitud: -41.08,
  longitud: -71.55,
  fecha: '2026-12-11',
  horaInicio: '10:00',
  duracionMin: 120,
  precio: 3_000_000,
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

const proponer = async (cambios: Partial<typeof kayak> = {}) => {
  const r = await tomas.c.post(url('/actividades'), { ...kayak, ...cambios });
  if (r.status !== 201) throw new Error(JSON.stringify(r.body));
  return r.body.actividad.id as string;
};
const alternativa = (original: string, cambios: Partial<typeof kayak> = {}) =>
  tomas.c.post(url(`/actividades/${original}/alternativas`), { ...kayak, ...cambios });
const resolver = (id: string, accion: 'confirmar' | 'denegar' | 'cancelar') =>
  ana.c.post(url(`/propuestas/${id}/${accion}`));
const estadoDe = async (id: string) =>
  (await ana.c.get(url(`/actividades/${id}`))).body.actividad.estado;

describe('CU10 y CU18: proponer y ver actividades', () => {
  it('la guarda pendiente y la devuelve con su horario', async () => {
    const r = await tomas.c.post(url('/actividades'), {
      ...kayak,
      horaInicio: '23:30',
      duracionMin: 90,
    });
    expect(r.status).toBe(201);
    expect(r.body.actividad).toMatchObject({
      tipo: 'ACTIVIDAD',
      estado: 'PENDIENTE',
      precio: 3_000_000,
      latitud: -41.08,
      autor: { usuarioId: tomas.id, nombre: 'Tomás' },
      actividad: {
        titulo: 'Kayak en el Nahuel Huapi',
        fecha: '2026-12-11',
        horaInicio: '23:30',
        horaFin: '01:00',
        duracionMin: 90,
        alternativaDe: null,
      },
    });
    const id = r.body.actividad.id;
    expect((await ana.c.get(url(`/actividades/${id}`))).body.actividad.id).toBe(id);
    expect((await ana.c.get(url('/actividades'))).body.actividades).toHaveLength(1);
    expect((await ana.c.get(url('/actividades?estado=CONFIRMADA'))).body.actividades).toEqual([]);
    expect((await ana.c.get(url('/actividades?estado=OTRO'))).status).toBe(400);
  });

  it('valida los datos: coordenadas obligatorias, hora y duración', async () => {
    for (const cuerpo of [
      { ...kayak, latitud: undefined },
      { ...kayak, horaInicio: '24:00' },
      { ...kayak, duracionMin: 0 },
      { ...kayak, duracionMin: 1441 },
      { ...kayak, titulo: '' },
    ]) {
      const r = await tomas.c.post(url('/actividades'), cuerpo);
      expect([r.status, r.body.error.codigo]).toEqual([400, 'VALIDACION']);
    }
  });

  it('RN-X4: el día de inicio tiene que estar dentro del viaje', async () => {
    const r = await tomas.c.post(url('/actividades'), { ...kayak, fecha: '2026-12-17' });
    expect([r.status, r.body.error.codigo]).toEqual([422, 'FUERA_DEL_VIAJE']);
  });

  it('responde 404 si no existe o el id no es válido, y 403 a quien no participa', async () => {
    expect((await ana.c.get(url(`/actividades/${crypto.randomUUID()}`))).status).toBe(404);
    expect((await ana.c.get(url('/actividades/no-es-uuid'))).status).toBe(404);
    const luis = await registrar(app, 'Luis', 'luis@mail.com');
    expect((await luis.c.get(url('/actividades'))).status).toBe(403);
    expect((await luis.c.post(url('/actividades'), kayak)).status).toBe(403);
  });
});

describe('RN-A2 y RN-R3: superposición', () => {
  it('rechaza proponer y confirmar sobre el horario de una confirmada, con el conflicto', async () => {
    const id = await proponer();
    const pendiente = await proponer({ titulo: 'Trekking', horaInicio: '11:00', duracionMin: 60 });
    expect((await resolver(id, 'confirmar')).status).toBe(200);

    const r = await tomas.c.post(url('/actividades'), {
      ...kayak,
      titulo: 'Bici',
      horaInicio: '11:59',
    });
    expect([r.status, r.body.error.codigo]).toEqual([409, 'SUPERPOSICION_HORARIA']);
    expect(r.body.error.detalles.conflictos).toEqual([
      { id, titulo: kayak.titulo, fecha: '2026-12-11', horaInicio: '10:00', duracionMin: 120 },
    ]);
    const c = await resolver(pendiente, 'confirmar');
    expect([c.status, c.body.error.codigo]).toEqual([409, 'SUPERPOSICION_HORARIA']);
    expect(await estadoDe(pendiente)).toBe('PENDIENTE');
    // Contigua en el borde: no choca.
    expect(
      (await tomas.c.post(url('/actividades'), { ...kayak, horaInicio: '12:00' })).status,
    ).toBe(201);
  });

  it('dos confirmaciones simultáneas de actividades superpuestas: solo una prospera', async () => {
    const a = await proponer();
    const b = await proponer({ titulo: 'Trekking', horaInicio: '11:00' });
    const respuestas = await Promise.all([resolver(a, 'confirmar'), resolver(b, 'confirmar')]);
    expect(respuestas.map((r) => r.status).sort()).toEqual([200, 409]);
    const confirmadas = (await ana.c.get(url('/actividades?estado=CONFIRMADA'))).body.actividades;
    expect(confirmadas).toHaveLength(1);
  });
});

describe('CU11 y RN-R4: alternativas', () => {
  it('la alternativa de una alternativa se vincula a la original', async () => {
    const original = await proponer();
    const r = await alternativa(original, { titulo: 'Trekking' });
    expect(r.status).toBe(201);
    expect(r.body.actividad.actividad.alternativaDe).toEqual({
      id: original,
      titulo: kayak.titulo,
    });
    const r2 = await alternativa(r.body.actividad.id, { titulo: 'Bici' });
    expect(r2.body.actividad.actividad.alternativaDe.id).toBe(original);
  });

  it('solo se proponen sobre actividades pendientes', async () => {
    const original = await proponer();
    await resolver(original, 'denegar');
    const r = await alternativa(original, { titulo: 'Trekking' });
    expect([r.status, r.body.error.codigo]).toEqual([409, 'ORIGINAL_NO_PENDIENTE']);
    expect((await alternativa(crypto.randomUUID())).status).toBe(404);
  });

  it('confirmar una opción deniega las demás pendientes; denegar la original no toca las alternativas', async () => {
    const original = await proponer();
    const trekking = (await alternativa(original, { titulo: 'Trekking' })).body.actividad.id;
    const bici = (await alternativa(original, { titulo: 'Bici' })).body.actividad.id;

    expect((await resolver(original, 'denegar')).body.afectadas).toEqual([]);
    expect(await estadoDe(trekking)).toBe('PENDIENTE');

    const r = await resolver(bici, 'confirmar');
    expect(r.status).toBe(200);
    expect(r.body.afectadas).toEqual([trekking]);
    expect(await estadoDe(trekking)).toBe('DENEGADA');
    expect(await estadoDe(original)).toBe('DENEGADA');
  });
});

describe('Confirmaciones simultáneas de opciones del mismo grupo', () => {
  it('una se confirma y la otra, ya denegada, responde 409 sin bloqueo mutuo', async () => {
    for (const fecha of ['2026-12-11', '2026-12-12', '2026-12-13']) {
      const a = await proponer({ fecha });
      const b = (await alternativa(a, { titulo: 'Trekking', fecha, horaInicio: '15:00' })).body
        .actividad.id;
      const respuestas = await Promise.all([resolver(a, 'confirmar'), resolver(b, 'confirmar')]);
      expect(respuestas.map((r) => r.status).sort()).toEqual([200, 409]);
      expect(respuestas.find((r) => r.status === 409)?.body.error.codigo).toBe(
        'TRANSICION_INVALIDA',
      );
    }
  });
});

describe('CU12, CU25 y CU26: votar y desvotar una actividad', () => {
  it('usa los endpoints comunes de propuestas', async () => {
    const id = await proponer();
    const v = await ana.c.put(url(`/propuestas/${id}/voto`), { valor: 'A_FAVOR' });
    expect(v.body.propuesta).toMatchObject({ votosAFavor: 1, miVoto: 'A_FAVOR' });
    const d = await ana.c.delete(url(`/propuestas/${id}/voto`));
    expect(d.body.propuesta).toMatchObject({ votosAFavor: 0, miVoto: null });
    expect((await ana.c.get(url(`/actividades/${id}`))).body.actividad.votosAFavor).toBe(0);
  });
});
