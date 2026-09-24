import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { clienteDePrueba, vaciarBase } from '../soporte/baseDePrueba.js';

const prisma = clienteDePrueba();
afterAll(() => prisma.$disconnect());

let ana: string;
let tomas: string;
let viaje: string;

beforeEach(async () => {
  await vaciarBase(prisma);
  await prisma.moneda.create({ data: { codigo: 'ARS', nombre: 'Peso argentino', decimales: 2 } });
  ana = (await prisma.usuario.create({ data: { nombre: 'Ana' } })).id;
  tomas = (await prisma.usuario.create({ data: { nombre: 'Tomás' } })).id;
  viaje = (
    await prisma.viaje.create({
      data: {
        nombre: 'Bariloche',
        destino: 'Bariloche',
        fechaInicio: new Date('2026-12-10'),
        fechaFin: new Date('2026-12-16'),
        monedaCodigo: 'ARS',
        creadoPorId: ana,
        membresias: { create: { usuarioId: ana, rol: 'ADMIN' } },
      },
    })
  ).id;
});

describe('F1 — restricciones del esquema (sección 4.3)', () => {
  it('rechaza un voto duplicado del mismo viajero sobre la misma propuesta', async () => {
    const propuesta = await prisma.propuesta.create({
      data: { viajeId: viaje, autorId: ana, tipo: 'ALOJAMIENTO', descripcion: 'x', ubicacion: 'y' },
    });
    await prisma.voto.create({
      data: { propuestaId: propuesta.id, usuarioId: tomas, valor: 'A_FAVOR' },
    });
    await expect(
      prisma.voto.create({
        data: { propuestaId: propuesta.id, usuarioId: tomas, valor: 'EN_CONTRA' },
      }),
    ).rejects.toThrow();
  });

  it('rechaza una credencial duplicada', async () => {
    const datos = {
      tipo: 'EMAIL_CONTRASENA' as const,
      identificador: 'ana@mail.com',
      secretoHash: 'h',
    };
    await prisma.credencial.create({ data: { ...datos, usuarioId: ana } });
    await expect(
      prisma.credencial.create({ data: { ...datos, usuarioId: tomas } }),
    ).rejects.toThrow();
  });

  it('rechaza un email sin normalizar', async () => {
    await expect(
      prisma.credencial.create({
        data: { usuarioId: ana, tipo: 'EMAIL_CONTRASENA', identificador: ' Ana@Mail.com' },
      }),
    ).rejects.toThrow(/credencial_email_normalizado/);
  });

  it('rechaza una deuda de un viajero consigo mismo', async () => {
    await expect(
      prisma.deuda.create({ data: { viajeId: viaje, deudorId: ana, acreedorId: ana, monto: 10n } }),
    ).rejects.toThrow(/deuda_entre_personas_distintas/);
  });

  it('rechaza una deuda con monto negativo', async () => {
    await expect(
      prisma.deuda.create({
        data: { viajeId: viaje, deudorId: tomas, acreedorId: ana, monto: -1n },
      }),
    ).rejects.toThrow(/deuda_monto_no_negativo/);
  });

  it('rechaza un segundo Admin activo en el mismo viaje', async () => {
    await expect(
      prisma.membresia.create({ data: { viajeId: viaje, usuarioId: tomas, rol: 'ADMIN' } }),
    ).rejects.toThrow();
  });

  it('permite un nuevo Admin cuando el anterior ya no está activo', async () => {
    await prisma.membresia.update({
      where: { viajeId_usuarioId: { viajeId: viaje, usuarioId: ana } },
      data: { estado: 'RETIRADA', bajaEn: new Date() },
    });
    await expect(
      prisma.membresia.create({ data: { viajeId: viaje, usuarioId: tomas, rol: 'ADMIN' } }),
    ).resolves.toBeDefined();
  });

  it('rechaza un viaje con fecha de inicio posterior a la de fin', async () => {
    await expect(
      prisma.viaje.create({
        data: {
          nombre: 'x',
          destino: 'y',
          fechaInicio: new Date('2026-12-16'),
          fechaFin: new Date('2026-12-10'),
          monedaCodigo: 'ARS',
          creadoPorId: ana,
        },
      }),
    ).rejects.toThrow(/viaje_rango_fechas/);
  });

  it('rechaza coordenadas incompletas en una propuesta', async () => {
    await expect(
      prisma.propuesta.create({
        data: {
          viajeId: viaje,
          autorId: ana,
          tipo: 'ACTIVIDAD',
          descripcion: 'x',
          ubicacion: 'y',
          latitud: -41.1,
        },
      }),
    ).rejects.toThrow(/propuesta_coordenadas_completas/);
  });
});
