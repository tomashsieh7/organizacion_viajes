import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { ResumenViaje } from '@viajes/compartido';
import { cargarCatalogos } from '../../prisma/semilla.js';
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
const nuevoViaje = {
  nombre: 'Bariloche',
  destino: 'Bariloche',
  fechaInicio: '2026-12-10',
  fechaFin: '2026-12-16',
  monedaCodigo: 'ARS',
};

beforeEach(async () => {
  app = crearApp(contenedor);
  await vaciarBase(db);
  await cargarCatalogos(db);
  ana = await registrar(app, 'Ana', 'ana@mail.com');
  tomas = await registrar(app, 'Tomás', 'tomas@mail.com');
  viajeId = (await ana.c.post('/api/viajes', nuevoViaje)).body.viaje.id;
  await ana.c.post(url('/participantes'), { email: 'tomas@mail.com' });
});

const lista = async (c: Cliente) => (await c.get('/api/viajes')).body.viajes as ResumenViaje[];
const delViaje = async (c: Cliente, id = viajeId) => (await lista(c)).find((v) => v.id === id)!;
const escribir = (autorId: string, contenido: string) =>
  db.mensaje.create({ data: { viajeId, autorId, contenido } });

describe('Lista de grupos: mensajes sin leer', () => {
  it('RN-X8: cuenta los mensajes de otros y PUT /mensajes/leidos los pone en cero', async () => {
    await escribir(tomas.id, 'Hola');
    await escribir(tomas.id, '¿Salimos a las 9?');
    await escribir(ana.id, 'Dale');
    expect(await delViaje(ana.c)).toMatchObject({ mensajesSinLeer: 2 });
    // Tomás entró después de que se creó el viaje: solo cuenta lo que llegó desde su alta.
    expect(await delViaje(tomas.c)).toMatchObject({ mensajesSinLeer: 1 });

    expect((await ana.c.put(url('/mensajes/leidos'), {})).status).toBe(204);
    expect(await delViaje(ana.c)).toMatchObject({ mensajesSinLeer: 0 });
    await escribir(tomas.id, 'Listo');
    expect(await delViaje(ana.c)).toMatchObject({ mensajesSinLeer: 1 });

    // Quien no participa no puede marcar.
    const luis = await registrar(app, 'Luis', 'luis@mail.com');
    expect((await luis.c.put(url('/mensajes/leidos'), {})).status).toBe(403);
  });
});

describe('Lista de grupos: última novedad', () => {
  it('RN-X8: muestra lo último que pasó, y un pago entre otros dos no aparece', async () => {
    expect(await delViaje(ana.c)).toMatchObject({ ultimaNovedad: null });
    await escribir(tomas.id, 'x'.repeat(500));
    const mensaje = (await delViaje(ana.c)).ultimaNovedad!;
    expect(mensaje).toMatchObject({ tipo: 'MENSAJE', autor: { id: tomas.id, nombre: 'Tomás' } });
    // Solo viaja una línea del mensaje.
    expect(mensaje.texto).toHaveLength(140);

    const alojamiento = (
      await ana.c.post(url('/alojamientos'), {
        nombre: 'Cabaña del lago',
        descripcion: 'Para seis',
        ubicacion: 'Villa Los Coihues',
        fechaDesde: '2026-12-10',
        fechaHasta: '2026-12-16',
      })
    ).body.alojamiento;
    expect((await delViaje(tomas.c)).ultimaNovedad).toMatchObject({
      tipo: 'PROPUESTA',
      autor: { id: ana.id },
      texto: 'Cabaña del lago',
      monto: null,
    });

    await ana.c.post(url(`/propuestas/${alojamiento.id}/confirmar`), {});
    expect((await delViaje(tomas.c)).ultimaNovedad).toMatchObject({
      tipo: 'CONFIRMACION',
      autor: { id: ana.id },
      texto: 'Cabaña del lago',
    });

    const comida = await db.categoriaGasto.findUniqueOrThrow({ where: { codigo: 'COMIDA' } });
    await ana.c.post(url('/gastos'), {
      titulo: 'Cena',
      categoriaId: comida.id,
      monto: 1_000,
      deudores: [tomas.id],
      modoDivision: 'IGUALES',
    });
    expect((await delViaje(tomas.c)).ultimaNovedad).toMatchObject({
      tipo: 'GASTO',
      autor: { id: ana.id },
      texto: 'Cena',
      monto: 1_000,
    });

    const luis = await registrar(app, 'Luis', 'luis@mail.com');
    await ana.c.post(url('/participantes'), { email: 'luis@mail.com' });
    await tomas.c.post(url('/pagos'), { acreedorId: ana.id, monto: 400 });
    const pago = {
      tipo: 'PAGO',
      autor: { id: tomas.id, nombre: 'Tomás', apodo: null },
      contraparte: { id: ana.id, nombre: 'Ana', apodo: null },
      texto: '',
      monto: 400,
    };
    expect((await delViaje(ana.c)).ultimaNovedad).toMatchObject(pago);
    expect((await delViaje(tomas.c)).ultimaNovedad).toMatchObject(pago);
    // Para Luis el pago es privado: lo último que ve es el gasto.
    expect((await delViaje(luis.c)).ultimaNovedad).toMatchObject({ tipo: 'GASTO' });
  });

  it('ordena por la novedad más reciente; los viajes sin novedades quedan al final', async () => {
    // Empieza antes: sin novedades iría primero.
    const antes = (await ana.c.post('/api/viajes', { ...nuevoViaje, fechaInicio: '2026-11-01' }))
      .body.viaje.id;
    expect((await lista(ana.c)).map((v) => v.id)).toEqual([antes, viajeId]);
    await escribir(tomas.id, 'Hola');
    expect((await lista(ana.c)).map((v) => v.id)).toEqual([viajeId, antes]);
  });
});
