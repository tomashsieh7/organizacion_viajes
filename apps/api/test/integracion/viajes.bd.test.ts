import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../../src/app.js';
import { vaciarBase } from '../soporte/baseDePrueba.js';
import { crearApiDePrueba, registrar, type Cliente } from '../soporte/apiDePrueba.js';

const { contenedor } = crearApiDePrueba();
let app = crearApp(contenedor);
const db = contenedor.prisma;
afterAll(() => db.$disconnect());

let ana: { c: Cliente; id: string };
let tomas: { c: Cliente; id: string };
let luis: { c: Cliente; id: string };
let viajeId: string;
const nuevoViaje = {
  nombre: 'Bariloche 2026',
  destino: 'Bariloche',
  fechaInicio: '2026-12-10',
  fechaFin: '2026-12-16',
  monedaCodigo: 'ARS',
};

beforeEach(async () => {
  app = crearApp(contenedor); // app nueva: el límite de registros por hora vuelve a cero
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
  const r = await ana.c.post('/api/viajes', nuevoViaje);
  viajeId = r.body.viaje.id;
});

const url = (sufijo = '') => `/api/viajes/${viajeId}${sufijo}`;

describe('CU01: crear viaje y consultarlo', () => {
  it('crea el viaje con quien lo crea como Admin y lo lista', async () => {
    const detalle = (await ana.c.get(url())).body.viaje;
    const { nombre, destino, fechaInicio, fechaFin } = nuevoViaje;
    const datos = { nombre, destino, fechaInicio, fechaFin };
    expect(detalle).toMatchObject({
      ...datos,
      miRol: 'ADMIN',
      miDeudaPendiente: 0,
      cantidadParticipantes: 1,
    });
    expect(detalle.moneda).toEqual({ codigo: 'ARS', nombre: 'Peso argentino', decimales: 2 });
    expect((await ana.c.get('/api/viajes')).body.viajes).toEqual([
      expect.objectContaining({ id: viajeId, miRol: 'ADMIN' }),
    ]);
    expect((await tomas.c.get('/api/viajes')).body.viajes).toEqual([]);
  });

  it('valida fechas y moneda', async () => {
    const invertido = await ana.c.post('/api/viajes', { ...nuevoViaje, fechaInicio: '2026-12-20' });
    expect(invertido.status).toBe(400);
    const moneda = await ana.c.post('/api/viajes', { ...nuevoViaje, monedaCodigo: 'XXX' });
    expect(moneda.status).toBe(422);
    expect(moneda.body.error.codigo).toBe('MONEDA_INEXISTENTE');
  });

  it('lista monedas y exige sesión', async () => {
    expect(
      (await ana.c.get('/api/monedas')).body.monedas.map((m: { codigo: string }) => m.codigo),
    ).toEqual(['ARS', 'CLP']);
  });

  it('RN-X1: quien no participa recibe 403 y un id inválido 404', async () => {
    const r = await tomas.c.get(url());
    expect(r.status).toBe(403);
    expect(r.body.error.codigo).toBe('NO_PARTICIPANTE');
    expect((await ana.c.get('/api/viajes/no-es-un-id')).status).toBe(404);
  });
});

describe('CU02: agregar viajero', () => {
  it('el Admin agrega por email; el agregado ve el viaje', async () => {
    const r = await ana.c.post(url('/participantes'), { email: ' TOMAS@mail.com ' });
    expect(r.status).toBe(201);
    expect(r.body.participante).toEqual({
      usuarioId: tomas.id,
      nombre: 'Tomás',
      apodo: null,
      rol: 'VIAJERO',
    });
    expect((await tomas.c.get(url())).body.viaje.miRol).toBe('VIAJERO');
  });

  it('avisa si el email no está registrado o si ya participa, y solo lo hace el Admin', async () => {
    const inexistente = await ana.c.post(url('/participantes'), { email: 'nadie@mail.com' });
    expect([inexistente.status, inexistente.body.error.codigo]).toEqual([
      404,
      'USUARIO_NO_REGISTRADO',
    ]);
    await ana.c.post(url('/participantes'), { email: 'tomas@mail.com' });
    const repetido = await ana.c.post(url('/participantes'), { email: 'tomas@mail.com' });
    expect([repetido.status, repetido.body.error.codigo]).toEqual([409, 'YA_ES_PARTICIPANTE']);
    const noAdmin = await tomas.c.post(url('/participantes'), { email: 'luis@mail.com' });
    expect([noAdmin.status, noAdmin.body.error.codigo]).toEqual([403, 'SOLO_ADMIN']);
  });
});

describe('CU03: eliminar participante', () => {
  beforeEach(async () => {
    await ana.c.post(url('/participantes'), { email: 'tomas@mail.com' });
    await ana.c.post(url('/participantes'), { email: 'luis@mail.com' });
  });

  it('RN-E3 a RN-E5: con deuda conserva el historial, retira votos pendientes y quita el acceso', async () => {
    const deuda = await db.deuda.create({
      data: { viajeId, deudorId: tomas.id, acreedorId: ana.id, monto: 50_000n },
    });
    const pendiente = await db.propuesta.create({
      data: {
        viajeId,
        autorId: tomas.id,
        tipo: 'ALOJAMIENTO',
        descripcion: 'x',
        ubicacion: 'y',
        votos: { create: { usuarioId: tomas.id, valor: 'A_FAVOR' } },
      },
    });
    const confirmada = await db.propuesta.create({
      data: {
        viajeId,
        autorId: tomas.id,
        tipo: 'ALOJAMIENTO',
        descripcion: 'x',
        ubicacion: 'y',
        estado: 'CONFIRMADA',
        votos: { create: { usuarioId: tomas.id, valor: 'A_FAVOR' } },
      },
    });

    const r = await ana.c.delete(url(`/participantes/${tomas.id}`));
    expect(r.body).toEqual({ bajaConDeuda: true });

    const m = await db.membresia.findUniqueOrThrow({
      where: { viajeId_usuarioId: { viajeId, usuarioId: tomas.id } },
    });
    expect(m).toMatchObject({ estado: 'ELIMINADA', bajaConDeuda: true });
    expect(m.bajaEn).not.toBeNull();
    expect(await db.deuda.findUnique({ where: { id: deuda.id } })).not.toBeNull();
    expect(await db.propuesta.count({ where: { autorId: tomas.id } })).toBe(2);
    expect(
      (await db.voto.findMany({ where: { usuarioId: tomas.id } })).map((v) => v.propuestaId),
    ).toEqual([confirmada.id]);
    expect(pendiente.id).not.toBe(confirmada.id);
    expect((await tomas.c.get(url())).status).toBe(403);
    expect((await ana.c.get(url('/participantes'))).body.participantes).toHaveLength(2);
  });

  it('sin deuda también es una baja lógica', async () => {
    expect((await ana.c.delete(url(`/participantes/${luis.id}`))).body).toEqual({
      bajaConDeuda: false,
    });
    expect(
      await db.membresia.count({ where: { viajeId, usuarioId: luis.id, estado: 'ELIMINADA' } }),
    ).toBe(1);
  });

  it('RN-E1 y RN-E2: solo el Admin, a otro participante activo', async () => {
    const noAdmin = await tomas.c.delete(url(`/participantes/${luis.id}`));
    expect(noAdmin.body.error.codigo).toBe('SOLO_ADMIN');
    const aSiMismo = await ana.c.delete(url(`/participantes/${ana.id}`));
    expect(aSiMismo.body.error.codigo).toBe('NO_PUEDE_ELIMINARSE_A_SI_MISMO');
  });

  it('RN-E8: volver a agregar a alguien reactiva su membresía', async () => {
    await ana.c.delete(url(`/participantes/${luis.id}`));
    expect((await ana.c.post(url('/participantes'), { email: 'luis@mail.com' })).status).toBe(201);
    expect(await db.membresia.count({ where: { viajeId, usuarioId: luis.id } })).toBe(1);
    expect((await luis.c.get(url())).status).toBe(200);
  });
});

describe('CU04 y CU24: salir del grupo y traspaso de la administración', () => {
  it('RN-T4: el Admin que es el único participante no puede salir', async () => {
    const r = await ana.c.post(url('/salir'));
    expect([r.status, r.body.error.codigo]).toEqual([409, 'ADMIN_UNICO_PARTICIPANTE']);
  });

  it('RN-T3: el Admin sale eligiendo sucesor', async () => {
    await ana.c.post(url('/participantes'), { email: 'tomas@mail.com' });
    expect((await ana.c.post(url('/salir'))).body.error.codigo).toBe('FALTA_SUCESOR');
    expect((await ana.c.post(url('/salir'), { nuevoAdminId: luis.id })).body.error.codigo).toBe(
      'SUCESOR_INVALIDO',
    );
    expect((await ana.c.post(url('/salir'), { nuevoAdminId: tomas.id })).status).toBe(200);
    expect((await tomas.c.get(url())).body.viaje.miRol).toBe('ADMIN');
    expect((await ana.c.get(url())).status).toBe(403);
  });

  it('RN-E7: un viajero sale con deuda y la respuesta lo indica', async () => {
    await ana.c.post(url('/participantes'), { email: 'tomas@mail.com' });
    await db.deuda.create({
      data: { viajeId, deudorId: tomas.id, acreedorId: ana.id, monto: 1_000n },
    });
    expect((await tomas.c.get(url())).body.viaje.miDeudaPendiente).toBe(1000);
    expect((await tomas.c.post(url('/salir'))).body).toEqual({ bajaConDeuda: true });
  });

  it('RN-T2: el Admin transfiere sin salir; solo el Admin puede hacerlo', async () => {
    await ana.c.post(url('/participantes'), { email: 'tomas@mail.com' });
    expect(
      (await tomas.c.post(url('/administracion/traspaso'), { nuevoAdminId: ana.id })).body.error
        .codigo,
    ).toBe('SOLO_ADMIN');
    expect(
      (await ana.c.post(url('/administracion/traspaso'), { nuevoAdminId: tomas.id })).status,
    ).toBe(204);
    expect((await ana.c.get(url())).body.viaje.miRol).toBe('VIAJERO');
  });

  it('dos traspasos simultáneos dejan exactamente un Admin', async () => {
    await ana.c.post(url('/participantes'), { email: 'tomas@mail.com' });
    await ana.c.post(url('/participantes'), { email: 'luis@mail.com' });
    const respuestas = await Promise.all([
      ana.c.post(url('/administracion/traspaso'), { nuevoAdminId: tomas.id }),
      ana.c.post(url('/administracion/traspaso'), { nuevoAdminId: luis.id }),
    ]);
    expect(respuestas.map((r) => r.status).sort()).toEqual([204, 403]);
    expect(await db.membresia.count({ where: { viajeId, rol: 'ADMIN', estado: 'ACTIVA' } })).toBe(
      1,
    );
  });
});
